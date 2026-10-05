---
title: "Cilium vs Calico vs Flannel: Choose the Network You Can Operate"
description: "Choosing between Cilium, Calico, and Flannel starts with the network your team can confidently operate."
tags: ["kubernetes", "networking", "platform-engineering"]
weight: 2
draft: false
---

When people compare Kubernetes CNIs, the discussion quickly becomes a feature matrix.

Does it support NetworkPolicy? BGP? eBPF? Encryption? Observability?

Those are useful questions, but I think they miss the first one:

**What networking problem does this cluster actually need the CNI to solve?**

A three-node K3s cluster and a large multi-tenant Kubernetes platform do not need the same network architecture.

## Start with what the CNI does

A pod needs an IP address and it needs to communicate with other pods. Kubernetes defines the desired networking model, but it does not implement that network by itself.

That is the CNI plugin's job.

At a simplified level:

```text
Pod A
  |
  | pod network
  v
Node A ---- underlying network ---- Node B
                                  |
                                  v
                                Pod B
```

The implementation can be an overlay, native routing, BGP, eBPF-based forwarding or a combination of these.

This matters operationally because when pod-to-pod communication fails, the CNI is no longer an abstract Kubernetes component. It becomes the network you have to debug.

## Flannel: solve the basic problem

Flannel is attractive because its objective is relatively narrow: provide pod networking.

For a small cluster where I need pods on different nodes to communicate and do not need advanced network controls, that simplicity is valuable.

It means fewer concepts to operate and fewer things to troubleshoot.

The trade-off is that Flannel by itself is not trying to be a complete Kubernetes networking and security platform. If the environment needs richer NetworkPolicy enforcement, advanced routing or deep network visibility, the design may need additional components or a different CNI.

This is why "Flannel has fewer features" is not automatically a criticism. Fewer features can be the correct architecture when those features are not requirements.

## Calico: networking plus policy

Calico is a natural choice when I want Kubernetes networking with strong NetworkPolicy capabilities and conventional networking concepts.

One reason I like Calico conceptually is that its architecture is understandable to somebody with a networking background. Routes, prefixes and BGP can be inspected with familiar tools and reasoning.

Depending on the design, Calico can use overlays or routed networking and can advertise routes with BGP.

That makes it useful when the Kubernetes network needs to integrate more explicitly with the surrounding network.

But BGP is not something I would introduce merely because it sounds more advanced. If I have a tiny cluster and an overlay completely solves the problem, introducing a routing protocol adds another operational surface without necessarily creating value.

## Cilium: networking moves deeper into the kernel

Cilium changes the discussion because eBPF allows it to implement networking, policy and observability directly through Linux kernel capabilities.

This can reduce dependence on traditional kube-proxy implementations and provides powerful visibility into network flows.

The interesting part is not simply "eBPF is faster." The architectural benefit is that the networking layer can understand Kubernetes identities and services while operating very close to where packets are processed.

That enables capabilities such as rich policy enforcement and flow observability that are very attractive on larger platforms.

The cost is that the team now needs to understand and operate that architecture.

Choosing Cilium and then treating it as a black box is not a good trade.

## Where kube-proxy fits

This is one area that often creates confusion.

The CNI and kube-proxy are solving related but different problems.

The CNI gives pods network connectivity. kube-proxy traditionally implements Kubernetes Service forwarding on each node using iptables or IPVS.

So when a pod connects to a ClusterIP:

```text
Pod
 |
 v
ClusterIP
 |
 v
Service forwarding
 |
 v
selected backend Pod IP
 |
 v
CNI network
 |
 v
destination pod
```

If the destination pod is on another node, the CNI network is responsible for making that pod IP reachable.

Cilium can also replace kube-proxy functionality using eBPF, which is one reason the boundaries look different in a Cilium architecture.

## How I would choose

For a small, trusted K3s environment where the objective is straightforward pod connectivity, I would seriously consider Flannel. It is difficult to justify operational complexity that solves requirements I do not have.

If I need mature NetworkPolicy, clear network segmentation and perhaps BGP integration, Calico becomes much more attractive.

If I am building a platform where network observability, identity-aware policy, performance and eBPF-based service networking are important, Cilium deserves serious consideration.

The decision therefore looks more like this:

```text
Need basic pod networking?
        |
        +--> Flannel

Need strong policy / traditional routing integration?
        |
        +--> Calico

Need advanced policy + observability + eBPF networking?
        |
        +--> Cilium
```

That is deliberately simplified. Real environments can make any of those branches more complicated.

## Don't select a CNI from the happy path

The more useful evaluation is to imagine failures.

A pod on node A cannot reach a pod on node B. Where do I look?

A NetworkPolicy unexpectedly blocks production traffic. Can I explain why?

A node joins but its pod CIDR is not reachable. Can the team inspect the routes?

Service traffic works on two nodes but not the third. Do we understand the service forwarding layer?

Those questions reveal whether the networking stack is operable by the team that owns it.

## Final thought

There is no universally "best" Kubernetes CNI.

Cilium can be technically more capable without being the correct choice for every cluster. Flannel can be much simpler without being inadequate. Calico can provide a useful middle ground or be the right answer specifically because of its routing and policy model.

I would choose the **simplest network architecture that satisfies the actual security, connectivity, performance and observability requirements**.

Because eventually the CNI will fail in some way, and at 2 AM the feature matrix matters much less than whether the team understands how packets are moving.
