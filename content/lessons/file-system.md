# Design an in-memory file system

A path is a sequence of decisions: starting at the root, choose one named child, then another. Representing those decisions explicitly turns a long string into a walk through a tree. The useful insight is that names are unique **inside one parent**, not across the entire system.

The same word “file system” can describe three different interview exercises. This lesson starts with a local namespace, extends it to composable file search, and identifies what changes when storage becomes distributed.

## Choose the contract

This exercise uses absolute paths such as `/notes/cache`, lowercase names, a distinguished root `/`, and no symbolic links, permissions, deletion, or `.`/`..` components. `mkdir` creates missing intermediate directories and is idempotent for an existing directory. `append` creates a missing file only when its parent directory already exists. Reading and listing require an existing path.

Listing a directory returns its **direct child names** in lexicographic order. Listing a file returns just that file's name. Appending preserves earlier content. Files cannot contain children, and a file and directory cannot share the same name inside a parent.

The interactive version rejects invalid operations instead of silently inventing entries. This makes mistakes visible. The linked references differ on whether writing a file creates its parents; always settle that rule before reusing an implementation.

## Start with a correct baseline

A flat map from full paths to nodes can answer exact lookups. But a naive directory listing must inspect paths to discover direct children, and shared prefixes are stored repeatedly. An additional map of directory-to-children fixes that scan while introducing a second view that mutations must keep consistent.

Another representation stores the hierarchy directly: each directory owns a map from one component name to its child node. Splitting `/notes/cache` yields two names. Resolve `notes` under the root, then `cache` under that directory. This is a trie over path components, not necessarily over individual characters.

Use distinct node kinds. A directory has children. A file has content. A tagged union or enum can prevent impossible states, such as a “file” with both children and unrelated directory metadata. In a language with shared node classes, enforce the same constraint deliberately.

## Trace the namespace

Before each step, predict which nodes will be created, which path will be traversed, and whether the operation changes state. Pay attention to listing a file versus listing its parent.

{{FILESYSTEM_LAB}}

The tree and search results show the same in-memory state. They do not read or write your computer's files. The search extension returns files only; its two predicates combine with AND.

## Keep three invariants

1. Each non-root node belongs to exactly one parent, and each parent has at most one child with a particular name.
2. Only directories have child entries. File operations cannot turn a directory into a file or create descendants below a file.
3. Read-only operations never create or modify nodes. The absence of a path is different from an empty file or an empty directory.

The lookup helper traverses existing nodes and fails if a component is missing or a prefix is a file. Directory creation is a separate operation that may add nodes. Separating those behaviors prevents a convenient “get or create” helper from making reads mutate the namespace.

## Account for all the work

Let P be the total path length, d the number of direct children listed, C the content returned, and A the newly appended content length. With hash-map children, resolving a path takes expected O(P), including parsing and hashing its names.

| Operation | Cost under this representation |
| --- | --- |
| Resolve or create directories | Expected O(P), including new component names |
| Append content in chunks | Expected O(P + A); avoid copying all old content on every append |
| Read and materialize file content | Expected O(P + C) |
| List a directory | Expected O(P) plus sorting and returning d names |
| Search a subtree | Visit its nodes and evaluate predicates; also pay for returned paths |

For listing, O(d log d) counts comparisons, but comparing variable-length names and copying output also costs time. If you state O(P + d log d), explicitly assume bounded-length names or include string costs.

An ordered map maintains lexical order during mutations and makes ordered iteration convenient; its child lookups require O(log d) comparisons. A hash map plus sort can be attractive when updates dominate or listings are infrequent. Neither is universally superior without a workload.

The search implementation constructs a full path for every visited node, including rejected files. Charge that string work even when few files match. Empty appends do not add chunks; byte metadata also accounts for a Unicode surrogate pair split across two appends.

## Extend the design to file search

Exact path lookup and subtree search are different operations. A predicate such as “name contains cache AND size is at least eight bytes” may require visiting many nodes. Keep traversal separate from the predicate so new conditions do not require a new traversal implementation.

Compose predicates with boolean operators. For an AND, both conditions must hold; for an OR, either may hold. Short-circuiting is useful when predicates are pure and one is expensive. A generator can stream matches instead of collecting every result before the caller receives any.

**Do not confuse filtering with pruning.** A directory failing a file-name predicate says nothing about whether one of its descendants will match. Skipping that subtree loses valid results. Pruning requires a stronger fact, such as a trusted aggregate proving no descendant can satisfy the query.

The public ByteByteGo file-search example separates traversal from composable criteria. That is a useful interface boundary to study. Adding symbolic links would turn traversal into a graph problem, requiring an explicit follow-link policy and possibly cycle detection. [Reference implementation](https://github.com/ByteByteGoHq/ood-interview/tree/main/file_search/filesearch).

## Inspect the executable model

The model below powers the explorer. Appends retain chunks; search uses stored UTF-8 byte counts. Its path contract is intentionally small, and the class is an educational model rather than a host operating-system adapter.

{{FILESYSTEM_CODE}}

## Test the boundaries

Test the empty root, repeated directory creation, names inserted in reverse lexical order, a name shared by files under two different parents, multiple appends, listing a file, and listing only direct children. Test rejected operations too: missing reads, missing parents on append, and attempts to create a child under a file.

For a stronger check, compare generated operation histories with a flat full-path map. Different representations make it less likely that the same pointer or traversal mistake appears in both implementations. The accompanying tests perform 2,000 deterministic updates against that reference, in addition to the focused boundary cases.

## Move from memory to a service

Persistence requires a recovery story: what is recorded before a write is acknowledged, and what happens if a process crashes partway through an update? Concurrent rename and lookup require a definition of atomicity. Permissions require an authorization check over the relevant operation and namespace.

Large content may live separately from namespace metadata. Then a metadata record can refer to an object that has not finished uploading, or an uploaded object can lack a committed metadata record. A design needs states, cleanup, and retry semantics for those cases.

Distribution adds ownership and failure boundaries. A local rename can update a few pointers; a rename spanning partitions is a coordination problem. Replicating bytes does not automatically provide the metadata consistency an application expects. State the required behavior before selecting a mechanism.

## Transfer questions

1. Change the contract so append creates missing parent directories. Which operation should own that behavior? Which test changes?
2. Add `rename(source, destination)`. What prevents moving a directory inside its own descendant? What happens if the destination exists?
3. Add symbolic links. Why is a tree-shaped API no longer enough to prove traversal terminates?
4. Search for files whose content contains a word. How does the cost differ from checking cached metadata? When would an index be justified?
5. Keep a cached subtree byte total. Which ancestors must change after an append or a move, and what does that do to mutation cost?

## Sources and scope

Practice the original problem at [LeetCode 588](https://leetcode.com/problems/design-in-memory-file-system/). The [Hello Interview discussion](https://www.hellointerview.com/community/questions/file-system-design/cm5eguhab02gq838obxubceit) and [AlgoMaster explanation](https://algomaster.io/learn/dsa/design-in-memory-file-system) were comparison references. Our prose, explorer, model, and tests are original; their rules are stated here so differing examples do not silently change the contract.
