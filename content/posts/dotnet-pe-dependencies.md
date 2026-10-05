---
title: "It Compiled, But Will It Run? PE Files and .NET Dependency Resolution on Windows"
description: "Explore PE files and the differences between managed, native, and runtime dependency resolution on Windows."
tags: ["dotnet", "windows", "software-engineering"]
weight: 5
draft: false
---

A successful build proves that the compiler found what it needed at build time.

It does not prove that the application will find everything it needs when it runs on another Windows machine.

I learned this while working on binary dependency exploration for .NET applications. The objective sounded simple: take every binary we compile and verify that its dependencies can actually be resolved.

Then native DLLs, NuGet packages, .NET Framework, modern .NET, x86/x64 and Windows system directories enter the picture.

The problem becomes much more interesting.

## Start with the artifact, not the project file

A project file describes what we intended to build. I wanted to inspect what we actually produced.

On Windows, executables and DLLs normally use the PE - Portable Executable - format. PE metadata tells us useful things about the binary, including information required to understand how it can be loaded.

A simplified dependency tree might look like this:

```text
Application.exe
 |
 +-- Company.Core.dll          managed
 |    +-- Newtonsoft.Json.dll managed / package
 |
 +-- Vendor.Native.dll        native
 |    +-- VCRUNTIME*.dll      native runtime
 |    +-- KERNEL32.dll        Windows
 |
 +-- Another.Library.dll      managed
```

The important word here is **tree** - or more accurately, graph.

Checking only the direct dependencies of `Application.exe` is not enough. `Vendor.Native.dll` can itself depend on another DLL that is missing from the target machine.

Dependency resolution therefore needs to be recursive.

## Managed and native dependencies are different problems

A .NET application can contain a mixture of managed assemblies and native PE binaries.

For managed assemblies, the runtime has assembly identity and runtime-specific loading rules to consider.

For native dependencies, Windows' native loader becomes part of the problem.

That means a resolver needs to understand what it is looking at before deciding where to search.

Conceptually:

```text
Inspect binary
     |
     +-- Managed assembly --> CLR/.NET resolution rules
     |
     +-- Native binary ----> Windows native DLL resolution
```

This distinction becomes especially important when a managed NuGet package ships native runtime assets underneath it.

The application may look completely managed from the C# code while ultimately depending on architecture-specific native DLLs.

## Finding a filename is not enough

Suppose the application needs `native.dll` and our validation finds a file with that name.

Resolved?

Not necessarily.

If the process is x64 and `native.dll` is x86, the dependency exists physically but cannot be loaded into that process.

This leads to errors such as `BadImageFormatException`, which can be misleading if you only interpret it as a corrupted file.

The dependency validator therefore needs at least two dimensions:

```text
Dependency exists?       yes/no
Architecture compatible? yes/no
```

And architecture is where Windows can confuse people.

## System32 and SysWOW64 are named backwards from what you expect

On 64-bit Windows:

```text
C:\Windows\System32
    -> 64-bit system binaries

C:\Windows\SysWOW64
    -> 32-bit system binaries
```

Yes, `System32` contains the 64-bit binaries.

WOW64 means *Windows 32-bit on Windows 64-bit*. It is the compatibility subsystem used to run 32-bit applications on 64-bit Windows.

File-system redirection also means that what a 32-bit process sees when accessing system paths can differ from what a 64-bit process sees. A dependency checker cannot blindly concatenate `C:\Windows\System32\something.dll` and assume it has reproduced runtime behavior.

## x86, x64 and AnyCPU

Native binaries normally make architecture constraints explicit. Managed assemblies add another case: `AnyCPU`.

An AnyCPU application can execute as a 64-bit process on a 64-bit runtime, but if it loads a native x86 library, that dependency cannot simply be loaded into the 64-bit process.

So the interesting question is not only:

> What architecture is this DLL?

It is:

> What architecture will the process run as, and are all native dependencies compatible with that process?

This is why dependency validation needs to propagate architecture context through the dependency graph.

## NuGet makes deployment easier, but the runtime graph still matters

NuGet packages can contain much more than one managed DLL.

A package can provide different assets for different target frameworks and runtime identifiers. It may contain managed compile-time assets, runtime assemblies and architecture-specific native libraries.

The compiler resolving a package is therefore not equivalent to proving that the deployment directory contains the correct runtime assets.

For validation, I care about the **published/build output that will actually be deployed**.

If a required dependency is supposed to come from the package, I want to know that the correct file ended up in the expected output for the selected runtime and architecture.

## .NET Framework and modern .NET are not identical

This becomes important when supporting applications across generations of .NET.

### .NET Framework

Classic .NET Framework applications have assembly loading behavior that can involve the application directory, configuration and historically the Global Assembly Cache for strongly named shared assemblies.

Assembly versions and binding redirects can also matter. Finding `Library.dll` does not necessarily mean it is the assembly identity the application requested.

### Modern .NET / .NET Core

Modern .NET deployment makes the dependency model more explicit.

Build and publish outputs can include `.deps.json`, which describes runtime dependencies and the assets selected for the application. Runtime identifiers also matter when selecting platform-specific assets.

Deployment mode changes the expectation as well:

```text
Framework-dependent
    -> application + dependencies
    -> compatible .NET runtime expected on host

Self-contained
    -> application + dependencies + .NET runtime
    -> larger artifact, fewer host runtime assumptions
```

A dependency validation tool should therefore know which deployment model it is validating rather than applying one set of assumptions to every .NET application.

## The dependency walker

The core approach I worked with can be reduced to a recursive graph walk.

```text
              +----------------+
              | Input binary   |
              +-------+--------+
                      |
                      v
              Read PE / metadata
                      |
             +--------+---------+
             |                  |
          managed             native
             |                  |
             v                  v
      runtime/assembly      native imports
        dependencies            |
             |                  |
             +--------+---------+
                      |
                      v
               Resolve candidate
                      |
          +-----------+-----------+
          |                       |
       not found                found
          |                       |
          v                       v
       missing             validate arch
                                  |
                                  v
                          inspect dependency
                                  |
                                  +----> recurse
```

A `visited` set is essential because dependency graphs are not guaranteed to be trees. Multiple binaries can reference the same dependency and cycles are possible.

## Where should the resolver search?

This is where I would be careful about trying to perfectly reimplement the Windows or .NET loader.

For build validation, the objective can be narrower: prove that every dependency we expect to ship is available from an approved location and compatible with the target architecture.

For example, dependencies may be classified as:

**Application dependencies** - expected in the compilation/publish output.

**Package/runtime dependencies** - copied from NuGet/runtime assets into the deployment output.

**Windows dependencies** - intentionally provided by the operating system.

That classification is useful because a Windows system DLL missing from the application directory is perfectly normal. A private application DLL missing from the same directory may be a deployment defect.

The output should therefore explain *why* a dependency is considered resolved, not just return `true`.

## What I would report

For every binary, I want a result closer to this:

```text
Application.exe [x64]
 |
 +-- Company.Core.dll [AnyCPU]       RESOLVED: application output
 |
 +-- Vendor.Native.dll [x64]         RESOLVED: application output
 |    +-- KERNEL32.dll [x64]         RESOLVED: Windows system
 |    +-- VendorRuntime.dll [x64]    MISSING
 |
 +-- Legacy.Native.dll [x86]         ARCHITECTURE MISMATCH
```

This immediately gives a build or release engineer something actionable.

A plain "dependency validation failed" does not.

## Why put this into CI?

The best time to discover a missing native dependency is not after installing the application on a clean production machine.

If the build pipeline already knows the intended target architecture and deployment output, it can validate the dependency graph before the artifact is released.

That turns a runtime failure into a build-time failure.

And that is exactly the kind of shift-left check I like: deterministic, directly related to whether the artifact can execute, and capable of producing a precise explanation when it fails.

## Don't try to simulate the universe

There is an important limit.

DLL loading can be affected by runtime behavior, dynamic loading, environment variables, application configuration and APIs that load libraries by name at runtime. Static PE inspection cannot discover every dependency that an application could possibly request.

Reflection and dynamically loaded managed assemblies create similar limitations.

So I would not describe this approach as proving that an application can never fail to load a dependency.

It proves something narrower and still extremely useful:

> All statically discoverable dependencies in the artifact graph can be resolved from the locations we expect, with compatible architecture, before the artifact leaves CI.

## Final thought

This work changed how I think about a "successful build."

Compilation validates source-level relationships. Deployment introduces another dependency graph involving the CLR, NuGet runtime assets, PE architecture, native libraries and the operating system.

When applications mix managed and native code, that graph is worth validating explicitly.

Because **the fact that a DLL exists somewhere on the build agent is not the same as proving that the deployed application can load it.**
