# Make the requirements do the designing.

System design asks you to choose behavior under constraints. A diagram is useful only when you can explain what each component owns, how requests and failures flow through it, and which tradeoffs follow from the requirements.

## Start at the right scale

| Exercise | Main design questions | Starting lesson |
| --- | --- | --- |
| Data structure design | Which operations, invariants, and complexity bounds are required? | [LRU cache](/system-design/lru-cache/) |
| Object and API design | Which component owns each responsibility? Which variations should compose? | [File system and file search](/system-design/file-system/) |
| Distributed service design | What happens across machines, failures, concurrent writes, and retries? | Use the requirements checklist below; full service case studies are planned. |

These scales connect, but answering one does not automatically answer the others. An in-memory file tree has no replication protocol. A distributed cache can have the right sharding scheme and still mishandle a local eviction.

## Write the contract

Choose the essential use cases and state what is out of scope. Define the caller, operation, response, failure behavior, and invariants. Ask which data is authoritative and which can be regenerated. Distinguish a successful acknowledgement from a promise of durable storage.

For a file service, “store files” leaves important decisions unresolved: maximum object size, append versus replacement, atomic rename, permissions, concurrent writers, and what a reader sees immediately after a write.

## Make estimates useful

Estimate requests per second, read/write mix, object sizes, retention, and skew only when they influence a decision. One million requests spread evenly across a day is about 11.6 requests per second; peak demand and hot keys can still dominate. An average is not a burst allowance or a latency percentile.

Attach units. Convert an assumed arrival rate into bytes per second, then into daily storage growth. Label the assumptions and change them to see whether the design choice survives. Capacity calculations should expose uncertainty, not decorate a whiteboard.

## Trace one request and one failure

Begin with the smallest system that satisfies the current contract. Trace a write from validation to durable acknowledgement, and a read from routing to the source of truth. Then introduce one failure: a lost response, a timed-out dependency, a duplicate request, a stale replica, or a process crash.

For each failure, identify what the caller knows and what the system has already done. A timeout does not prove that the operation failed. A retry requires a decision about idempotency. Adding a queue changes when work completes and introduces duplicate-delivery and backlog questions.

## Add a component to resolve a named pressure

A cache can reduce repeated reads, but needs a freshness and invalidation contract. Partitioning can distribute storage, but introduces hot-key and rebalancing questions. Replication can improve resilience, but introduces coordination and consistency choices. Each addition should answer a concrete bottleneck or failure requirement.

For a useful discussion, compare at least two plausible choices. State what would make you switch between them. “Use a database, cache, and queue” is a component list; it is not yet a design argument.

## The format for worked designs

Each worked lesson should include a precise contract, a baseline, the pressure that changes it, a representation or architecture, operation traces, invariants, failure cases, tests, and changed-requirement exercises. The current examples are [LRU cache](/system-design/lru-cache/) and [in-memory file system](/system-design/file-system/).

The broader service curriculum will need separate, fully reviewed cases. The public [ByteByteGo foreword](https://bytebytego.com/courses/system-design-interview/foreword) emphasizes open-ended requirements, communication, and tradeoffs; that is useful framing, not an answer key for any one architecture.
