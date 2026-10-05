---
title: "IPAM: Why We Need It and Why It Gets Hard at Scale"
description: "Why address management becomes infrastructure, and how ownership, allocation, and reconciliation work at scale."
tags: ["ipam", "azure", "networking"]
weight: 1
draft: false
---

IP address management looks unnecessary when the environment is small.

You have a few VNets, somebody keeps a spreadsheet with the CIDRs, and before creating a new network you check that the range is not already used. It works.

Then the cloud estate grows.

You have tens or hundreds of subscriptions, multiple regions, separate production and non-production environments, connectivity hubs, private endpoints, on-premises networks and different teams deploying infrastructure independently. At that point, the problem is no longer *which CIDR should I use?* The problem is knowing what is already allocated, what is actually in use, who owns it, and whether the information you are looking at is still true.

That is where IPAM becomes infrastructure rather than documentation.

## The problem IPAM is really solving

An IPAM system should answer a few simple questions reliably:

- Which address spaces do we own?
- Which ranges are allocated?
- Which ranges are still free?
- Who owns an allocation?
- Where is it deployed?
- Can a new network be allocated without creating an overlap?

The first three are easy in a lab. Ownership and state are where things become interesting at scale.

Consider a company with a central networking team but hundreds of cloud subscriptions. Application teams create VNets through Terraform or deployment pipelines. Some networks are deleted. Others are resized. A project is abandoned but its reservation remains. Somebody creates a VNet manually. A migration temporarily requires two ranges instead of one.

A spreadsheet can represent the intended state, but Azure represents the actual state. Eventually those two views disagree.

## Allocation is not enough

A common first version of IPAM is essentially a CIDR allocator:

```text
10.0.0.0/8
    |
    +-- 10.10.0.0/16  Production
    +-- 10.20.0.0/16  Non-production
    +-- 10.30.0.0/16  Shared services
```

Useful, but the real problem starts after allocation.

Suppose IPAM says `10.20.40.0/24` belongs to application A. Azure says no VNet exists with that range. Is the range free?

Maybe the deployment failed. Maybe the VNet was deleted. Maybe the IPAM record is stale. Maybe the project is going live next week and the reservation is intentional.

You cannot safely decide from either system alone.

This is why I see IPAM as a lifecycle problem:

**request -> allocate -> deploy -> discover -> reconcile -> release**

The last three steps are often missing.

## At scale, you need a source of truth

The difficult architectural question is not where to store CIDRs. It is deciding which system is authoritative for which information.

For example:

| Information | Possible authority |
| --- | --- |
| Address pool definition | IPAM |
| Allocation/owner | IPAM |
| Actual VNet prefix | Azure |
| Application ownership | CMDB / service catalog |
| Subscription metadata | Cloud platform / CMDB |

Trying to make one system authoritative for everything usually creates another synchronization problem.

A better model is to explicitly define ownership and reconcile the systems.

## Discovery changes the design

In Azure, the platform can periodically discover VNets and their prefixes across subscriptions. The discovered state can then be compared with IPAM allocations.

Conceptually:

```text
IPAM desired state ----+
                       +--> reconciliation --> drift / action
Azure actual state ----+
```

Now useful questions become possible:

- VNet exists but has no IPAM allocation.
- Allocation exists but no VNet can be found.
- Prefix in Azure differs from the registered prefix.
- Two allocations overlap.
- A VNet was created outside the expected process.

This is much more valuable than simply generating the next available `/24`.

## Automation introduces its own failure modes

Once allocation becomes automated, IPAM becomes part of the deployment path. That means it needs the same engineering discipline as any other platform service.

What happens if an allocation succeeds but the VNet deployment fails?

What happens if two pipelines request a range simultaneously?

What happens if the deployment succeeds but updating the IPAM record fails?

What happens when somebody changes the VNet manually afterward?

These are distributed-system problems hiding behind network automation: concurrency, idempotency, partial failure and eventual consistency.

The workflow should therefore be safe to retry. A failed pipeline should not silently consume ranges forever, and a reconciliation process should be able to detect incomplete transactions.

## Hierarchy matters

Large environments also need a deliberate allocation hierarchy.

Instead of handing arbitrary prefixes to every team, reserve address space at useful boundaries such as region, environment or business domain.

For example:

```text
Enterprise pool
 |
 +-- Europe
 |    +-- Production
 |    +-- Non-production
 |
 +-- Americas
      +-- Production
      +-- Non-production
```

The exact hierarchy is organization-specific. The point is to make routing, growth and ownership predictable.

Over-allocating everything creates waste. Allocating ranges too tightly creates constant resizing and fragmentation. IP planning is therefore partly a capacity-management problem.

## The human side is harder than CIDR math

CIDR calculations are deterministic. Organizations are not.

The hardest questions are often:

- Who is allowed to allocate a range?
- Can teams bypass IPAM?
- Who approves unusually large allocations?
- When can an unused reservation be reclaimed?
- What happens to existing manually created networks?
- Is IPAM advisory or enforced by the deployment platform?

If those rules are unclear, even a technically excellent IPAM product becomes another database nobody fully trusts.

## What I would optimize for

At scale, I would optimize an IPAM design around four properties:

**One clear allocation authority.** New address space should come from a controlled source rather than humans guessing free ranges.

**Automated discovery.** The platform should continuously understand what actually exists.

**Reconciliation instead of blind synchronization.** Differences should be classified before destructive remediation is attempted.

**Ownership metadata.** A CIDR without an application, environment and owner is only half an allocation.

## Final thought

IPAM is easy when the network is small because humans can keep the entire state in their heads.

At scale, they cannot.

The value of IPAM is not the ability to calculate the next subnet. Libraries can do that. The value is maintaining a trustworthy relationship between **address space, ownership, desired state and deployed infrastructure** while hundreds of independent changes happen around it.

That is the point where IPAM stops being a spreadsheet and becomes part of the cloud platform.
