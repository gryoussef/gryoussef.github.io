---
title: "Shipping Fast vs Quality Code Is the Wrong Trade-off"
description: "The quality controls that shorten feedback loops and make fast delivery sustainable."
tags: ["software-engineering", "devops", "delivery"]
weight: 4
draft: false
---

Engineering discussions often frame delivery as a choice:

**Do we ship fast, or do we do it properly?**

I do not think that is the useful question.

Teams obviously need to ship. A perfect system that arrives six months too late has little value. But moving quickly by removing every quality control usually does not create sustained speed either. It creates deferred work that eventually appears as incidents, fragile deployments and engineers afraid to change the system.

The real question is:

**Which quality controls allow us to move quickly repeatedly?**

## Speed is not deployment frequency alone

A team can deploy ten times per day and still be slow if every production issue takes hours to diagnose.

Another team can have a huge CI pipeline with every possible security and quality scanner and still be slow because developers wait 45 minutes for feedback on every commit.

Neither extreme is good engineering.

I think delivery speed needs to include the whole loop:

```text
change -> validate -> deploy -> observe -> learn -> change
```

The shorter and safer that loop is, the faster the team can actually move.

## Quality gates have a cost

Every control we add to CI/CD consumes something: time, compute, maintenance effort or developer attention.

Unit tests, integration tests, SAST, dependency scanning, container scanning, infrastructure validation and policy checks can all be valuable.

But "more gates" is not automatically "more quality."

A scanner that produces hundreds of ignored findings is not protecting the system. A flaky integration suite that developers rerun until it turns green is actively reducing trust in the pipeline.

The right question for every gate is:

> What failure are we trying to prevent, and is this the cheapest place to detect it?

A formatting error should be detected locally or in seconds. A container vulnerability should be detected before the image is promoted. A production-specific behavior may require a canary or runtime signal rather than another static CI check.

## Move cheap feedback left

The earlier a problem can be detected cheaply and reliably, the earlier I want to detect it.

```text
Developer      CI                 Pre-prod           Production
   |            |                    |                   |
 lint       unit tests          integration        observability
 format     build               deployment         SLOs/alerts
 types      SAST                smoke tests        canary signals
            dependency scan
```

This is not about putting everything into the first column. Some problems only exist in realistic environments.

The objective is to avoid discovering a five-second syntax or policy error after a 20-minute deployment.

## Reproducibility is a speed feature

One of the most underrated quality practices is reproducibility.

If the same source and declared dependencies produce predictable artifacts, debugging becomes easier. If infrastructure is provisioned from code, environments become easier to recreate. If images are immutable, rollback becomes easier to reason about.

These are normally described as quality or reliability practices. They also make teams faster because less time is spent asking:

> Why does this work there but not here?

## Rollback changes the risk calculation

Not every release needs to be perfect before it reaches production.

It needs to be **safe enough to release and cheap enough to recover from**.

That means deployment design matters as much as pre-deployment validation.

A team with automated rollback, backward-compatible changes, feature flags, canaries and good observability can safely accept risks that would be irresponsible in a system where every deployment is an irreversible event.

This is why I prefer to think about release engineering as controlling the **blast radius of uncertainty**.

We can never test every possible production condition. We can make uncertainty survivable.

## Technical debt is sometimes a valid decision

There are situations where the fastest implementation is correct even if it is not the architecture we want long term.

A proof of concept does not need the same resilience as a payment system. A feature being validated with ten users may not need the platform required for ten million users.

The problem is not consciously taking technical debt.

The problem is taking debt without recording why, without understanding the consequences and without any trigger for paying it back.

"Temporary" solutions become permanent infrastructure remarkably quickly.

## Platform engineering should reduce the trade-off

This is one of the reasons internal platforms are useful.

If every application team has to independently build CI/CD, secrets handling, observability, Kubernetes deployment conventions and security scanning, then quality is expensive.

If the platform provides good defaults, the secure and reliable path can also become the fastest path.

For example, an application pipeline template can already include:

- build and test stages;
- dependency and container scanning;
- artifact publishing;
- deployment conventions;
- standard observability hooks.

The application team consumes the capability instead of rebuilding it.

That is a much better way to improve quality than asking every developer to remember a 40-page checklist.

## Measure the feedback loop

I would care about questions such as:

- How long until a developer knows a change is broken?
- How often do deployments fail?
- How quickly can we restore service?
- How much of deployment is manual?
- How frequently do false-positive gates block delivery?
- How easy is rollback?

Those signals tell us much more than arguing abstractly about whether a team is moving "too fast."

## Final thought

Fast and careless are not synonyms. Neither are slow and high-quality.

Good engineering creates mechanisms that make safe changes cheap: fast feedback, reproducible builds, automation, small releases, observable systems and recoverable deployments.

The target is not to choose between speed and quality.

It is to build a delivery system where **quality is what allows us to keep shipping fast after the first release**.
