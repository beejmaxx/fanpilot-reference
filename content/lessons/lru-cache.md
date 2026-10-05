# Design an LRU cache

A cache is a bounded memory of useful work. When that memory fills, we need a rule for deciding what to forget. **Least recently used** means discarding the entry whose last successful access or write happened earliest. The difficult part is keeping that order accurate without searching through the whole cache.

This lesson connects [hashing](/patterns/hashing-and-sufficient-summaries/), [linked lists](/patterns/linked-lists-and-recursive-trees/), and [composed invariants](/patterns/data-structure-design-and-composed-invariants/). It is a local data-structure design. A shared cache service introduces additional problems later in the lesson.

## Set the contract before choosing classes

Use a fixed positive capacity measured in entries. `get(key)` returns either a hit with a value or an explicit miss. A hit becomes the most recently used entry; a miss changes nothing. `put(key, value)` creates or updates one entry and marks it most recently used. Updating an existing key must not evict another entry. A new key at capacity evicts exactly one victim.

We want expected O(1) work per operation with fixed-size keys and values, and O(capacity) stored entries. This is an expected hash-table bound, not a worst-case latency guarantee. Hashing a large key, allocating memory, and copying a large value have their own costs.

An explicit hit/miss result lets the cache store values such as zero or null without ambiguity. Reject capacity zero in this version; supporting a disabled cache is a different, reasonable contract.

## Derive the representation

Start with an array ordered by recency. Moving an item to the front and finding a key can cost O(capacity). A hash map fixes the lookup, but storing timestamps still leaves a scan to find the oldest entry.

A heap can find that oldest timestamp, but moving a frequently accessed item normally costs O(log capacity), with additional bookkeeping for stale records or heap positions. The requirement is stronger: we need to remove an already-known item from the middle of an ordering in constant pointer work.

A doubly linked list supports exactly that operation. The hash map stores a reference to each key's node. The list connects those same nodes from most to least recent. The node stores its key as well as its value, so an eviction can remove the corresponding hash-map entry directly.

The general move is **one collection for finding an object, another for ordering the same objects**. Each structure supplies an operation the other lacks. You must prove they remain synchronized.

## Predict, then step through it

With capacity two, consider `put(A, 10)`, `put(B, 20)`, `get(A)`, then `put(C, 30)`. Pause before the last operation and name the victim. FIFO and LRU produce different answers here.

{{LRU_LAB}}

The diagram shows the order after each complete operation. It uses a real hash-map-plus-linked-list implementation. Rendering the diagram and checking its invariants scan the small cache; that display work is separate from the core get/put operations.

## Prove the four invariants

1. **Identity:** every stored key maps to exactly one real list node, and every real list node has exactly one map entry.
2. **Connectivity:** for adjacent nodes x and y, `x.next == y` and `y.prev == x`. The two boundary sentinels delimit the list and are never stored in the map.
3. **Recency:** the first real node is most recent and the last real node is least recent. For any two entries, their order agrees with their last successful access or write.
4. **Bounded size:** after each public operation, the number of real nodes equals the map size and is no greater than capacity.

Initialization is an empty map with the sentinels linked together. A hit changes only the position of its existing node. Removing that node and placing it first preserves the relative order of every other entry. A miss changes no state. An update reuses its node and preserves size. A full-cache insertion removes the last real node from both structures, then inserts the new entry first.

These facts prove eviction correctness: the victim is the last node by the recency invariant, so it has the oldest relevant use. Connectivity alone would not establish that we evicted the correct key.

## Separate mechanisms from policy

Implement two small list operations: unlink a known node, and insert a detached node at the front. Promotion composes them. Sentinels let the same unlink logic handle the only entry, the first entry, and the last entry without special null-neighbor branches.

Keep those operations internal. The public cache coordinates changes to the map and list; callers should never receive mutable nodes. A `contains` or `peek` operation needs an explicit recency contract. Calling `get` from an ostensibly non-mutating inspection method would change the next eviction.

The implementation used by the simulator is available below. `snapshot` and `assertInvariants` are teaching and test helpers, each O(capacity); they are not part of the constant-time core API.

{{LRU_CODE}}

## Test histories, not just return values

Many cache defects appear only after a sequence of operations. A miss can return the right result even though an earlier eviction left a detached node in the map. Compare both the results and the entire recency order with a deliberately simple array-based reference.

| History | What it catches |
| --- | --- |
| Fill capacity one, insert another key | Removal of the only real node |
| Fill the cache, update an existing key | Accidental eviction or duplicate nodes |
| Read the oldest key, insert another | Failure to promote on a hit |
| Miss, then insert at capacity | Accidental promotion or insertion on a miss |
| Evict a key, then request it | Stale map entry |
| Store an explicit empty value | Confusing stored values with a miss |
| Alternate updates and reads repeatedly | Broken forward/backward links |

The executable tests enumerate all 98,304 length-five histories over eight operations across capacities one through three. They compare with the array model and check the map/list invariants after every operation. That is strong evidence for those small cases, not a proof over every possible history; the invariant argument supplies the general reasoning.

## Change one requirement at a time

**Thread safety.** A hit mutates recency. Protect the combined map-and-list operation with one lock before attempting fine-grained synchronization. A thread-safe map alone does not make the composition safe. Lock striping by key does not by itself protect a shared global recency list. An eviction callback invoked under the lock can deadlock through re-entry or turn a fast operation into slow I/O; capture events and define delivery behavior deliberately.

**Time to live.** Expiration and capacity eviction answer different questions. LRU chooses a victim under memory pressure; TTL decides whether an entry is still usable. Define whether reads refresh expiry, and whether expired entries are reclaimed on access or proactively. Use a suitable monotonic clock for local elapsed time. Efficient proactive expiry requires additional ordering or timing machinery.

**Byte capacity.** Counting entries no longer bounds memory. Track an agreed weight, reject or separately handle oversized entries, and consider that one insertion can evict several items. The original O(1) per-put claim no longer follows automatically.

**LFU.** Frequency is additional state. A useful constant-time LFU design uses frequency buckets and a recency ordering within each bucket, plus access to the minimum nonempty frequency. Renaming a policy interface cannot make one LRU list implement those operations.

**Write policies.** Write-through persists changes when a write occurs. Write-back delays persistence and must track dirty data, failures, and flush behavior. Eviction notifications alone do not define either policy correctly.

## Where the local design stops

A network cache must also answer who owns a key, what happens on a timeout, how clients retry, how concurrent loads are coalesced, and what stale data the application may tolerate. Cache eviction is not a durability policy. Losing a disposable cached copy and losing the authoritative write are very different failures.

Consider two clients missing the same expensive key simultaneously. Both can load the origin even if the LRU implementation is perfectly correct. Coalescing in-flight loads addresses that request pattern; a doubly linked list does not.

Exact recency also has a coordination cost. Production implementations may relax ordering or choose another policy. Redis documents approximate LRU sampling; Caffeine documents buffered maintenance and a Window TinyLFU admission policy. Those are distinct designs, not evidence that an exact global LRU list scales without coordination. [Redis eviction](https://redis.io/docs/latest/develop/reference/eviction/), [Caffeine design](https://github.com/ben-manes/caffeine/wiki/Design).

## Check transfer without the answer

1. You add a `peek` operation that returns a value without recording a use. Which invariant changes, if any?
2. A successful `get` marks a key recent before the caller receives the response. The response is lost. Has the cache become incorrect under our local contract? What additional ambiguity appears in a remote API?
3. An item of weight seven arrives in a byte-bounded cache with only three bytes free. Why can a single eviction be insufficient?
4. Your application frequently scans a huge sequence of one-time keys. Explain why ordinary LRU can evict a useful working set. Which new decision would an admission policy make?

Try [LeetCode 146](https://leetcode.com/problems/lru-cache/) from a blank editor, then compare it with [LeetCode 460](https://leetcode.com/problems/lfu-cache/). Explain the new state before writing the second implementation.

## Sources and further study

This lesson's derivation, simulator, and tests are original. The [SystemDesign Academy LRU lesson](https://www.systemdesign.academy/lld/lru-cache) was a reference for the subject and depth. The production-policy observations above are tied to their maintainers' documentation. For Java locking mechanics, consult the [ReentrantLock API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html), including releasing the lock in a `finally` block.
