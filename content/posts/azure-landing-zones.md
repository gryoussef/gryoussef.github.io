---
title: "Azure Landing Zones: Centralize the Guardrails, Not Every Decision"
description: "Build shared guardrails for identity, networking, and governance while leaving teams room to make decisions."
tags: ["azure", "cloud", "platform-engineering"]
weight: 3
draft: false
---

An Azure landing zone is sometimes presented as a collection of subscriptions, policies and management groups that you deploy before application teams arrive.

That is technically true, but it undersells the problem.

The real objective is to make it possible for many teams to use Azure independently **without every team having to redesign identity, networking, security, governance and operations from zero**.

## Why a landing zone appears

With one subscription and one team, governance can be informal.

At scale, the questions multiply:

- Where should production subscriptions live?
- Which policies must apply everywhere?
- Who controls connectivity to on-premises?
- Where do private DNS zones live?
- How do workloads reach shared services?
- Which logs must be centralized?
- How are permissions delegated?
- How do we prevent teams from accidentally deploying unsupported architectures?

If each application team answers these independently, the cloud estate becomes inconsistent very quickly.

A landing zone creates the platform boundary within which teams can move faster.

## Management groups are the policy hierarchy

A useful landing-zone design normally starts above subscriptions.

```text
Tenant
 |
 +-- Platform
 |    +-- Connectivity
 |    +-- Management
 |    +-- Identity
 |
 +-- Landing Zones
 |    +-- Production
 |    +-- Non-production
 |
 +-- Sandbox
```

The exact hierarchy is less important than having a deliberate one.

Management groups let governance follow organizational intent. Policies and RBAC can be assigned at the appropriate level instead of duplicated manually across every subscription.

That also means the hierarchy should not mirror the org chart blindly. Org charts change. Platform boundaries should represent governance requirements that are relatively stable.

## Subscription vending is where the platform becomes useful

A landing zone becomes much more valuable when a new subscription is not a ticket-driven manual exercise.

A team requests a workload environment and the platform can provision a subscription with the expected baseline:

```text
Request
  |
  v
Subscription creation
  |
  +--> Management group placement
  +--> RBAC
  +--> Policy baseline
  +--> Networking
  +--> Logging / monitoring
  +--> Budget / metadata
  +--> IPAM allocation
```

Now governance is part of provisioning rather than a review performed three months later.

## Networking is usually where centralization becomes difficult

Identity and policy centralization are relatively intuitive. Networking creates harder ownership questions.

A common model is to centralize shared connectivity while allowing workload teams to own their application networks.

For example:

```text
                    On-premises
                         |
                  ExpressRoute/VPN
                         |
                   Connectivity Hub
                    /            \
                   /              \
            Workload VNet A    Workload VNet B
```

The platform team can own connectivity, firewalling, DNS and IPAM. Application teams own subnets and workload-specific controls within agreed boundaries.

This separation is important. Centralization should not mean that every subnet change requires the central network team.

## Private DNS is a good example of why platform boundaries matter

Private Endpoints look application-specific, but Private DNS quickly becomes shared infrastructure.

If every subscription independently creates copies of the same Private Link zones, name resolution becomes difficult to reason about across connected networks.

Centralizing Private DNS can therefore make sense, while workload teams still create their own Private Endpoints.

That creates a clean boundary:

**Application team:** I need private connectivity to this PaaS service.

**Platform:** Here is the standardized DNS and network path that makes it work across the enterprise.

This is what I want from a landing zone: centralize the parts that must be globally consistent while leaving workload decisions with workload owners.

## Policy should create guardrails, not paralysis

Azure Policy is one of the strongest landing-zone mechanisms and also one of the easiest to misuse.

A policy can deny public IPs, enforce allowed regions, require diagnostic settings or constrain resource configuration.

But every deny policy is also an API contract with application teams.

If the platform denies a configuration, there should be an understood supported alternative. Otherwise governance simply becomes a deployment blocker.

I prefer to think in layers:

- **Deny** configurations that create unacceptable risk.
- **Deploy/modify** baseline configuration that can safely be automated.
- **Audit** things we need visibility into before we are ready to enforce them.

Moving directly from no governance to hundreds of deny policies usually creates friction rather than security.

## Centralize ownership, not necessarily resources

A common mistake is assuming that a central platform means putting everything into central subscriptions.

What needs to be centralized is often **control and responsibility**, not the workload itself.

For example:

| Capability | Typical ownership |
| --- | --- |
| Management group structure | Platform |
| Global policy baseline | Platform / Security |
| ExpressRoute / shared WAN | Network platform |
| Private DNS | Network platform |
| Workload VNet | Application team within guardrails |
| Application NSGs | Application team / shared standards |
| Application resources | Application team |

This model scales better because the platform team does not become an approval queue for normal application work.

## Landing zones are a product

The most important shift is to stop thinking of the landing zone as a one-time Terraform deployment.

Cloud requirements change. Azure services change. Security requirements change. Teams discover that some controls are too restrictive and others are missing.

The landing zone therefore needs versioning, testing, rollout mechanisms, documentation and feedback from its consumers.

In other words, it behaves like a product.

## Final thought

A good landing zone should make the secure path the easy path.

If teams constantly need exceptions, manual tickets and platform engineers to deploy ordinary workloads, the landing zone is technically governed but operationally failing.

The goal is not maximum centralization.

The goal is a clear contract:

**The platform owns the enterprise guardrails and shared foundations. Application teams get enough freedom inside those boundaries to ship independently.**

That is what makes an Azure landing zone useful at scale.
