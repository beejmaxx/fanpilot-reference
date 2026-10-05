# What was reviewed, and what we took from it.

This guide combines established algorithm references, public teaching resources, learning research, and independently written examples. The aim is to help you derive and transfer ideas. A longer problem list by itself does not establish that a guide teaches more effectively.

## Pattern curricula and practice advice

| Source | Useful contribution | How it shapes this guide |
| --- | --- | --- |
| [NeetCode's interview preparation guidance](https://blog.neetcode.io/p/prepare-coding-interviews) | Structured topic coverage and a manageable starting set. | Use a dependency-based path, with problems paired to the reasoning being learned. |
| [AlgoMonster's flowchart](https://algo.monster/flowchart) | Questions that help narrow plausible algorithm families. | Treat recognition cues as hypotheses. Require an invariant or proof before accepting the choice. |
| [Sean Prashad's LeetCode Patterns](https://seanprashad.com/leetcode-patterns/) | A topic-organized practice index. | Pair examples with variations and explicit technique boundaries. |
| [Grind 75's FAQ](https://www.techinterviewhandbook.org/grind75/faq) | A rationale for choosing and scheduling a finite preparation set. | Make the next exercise depend on prerequisites and observed weaknesses. |
| [USACO Guide: Practicing](https://usaco.guide/general/practicing) | Experienced competitors' advice on attempts, editorials, and follow-through. | Use help when progress stalls, then reconstruct the solution and test a variation. |

These resources are useful teaching references, not controlled comparisons proving that one list or schedule is best. Our organization around bottlenecks, observations, transformations, and invariants is an editorial synthesis.

## What the learning studies support

Worked examples and retrieval practice provide evidence for ingredients of the study loop. They do not prove a particular LeetCode curriculum or review interval is optimal.

In an introductory programming study, [subgoal-labeled worked examples](https://doi.org/10.1186/s40594-020-00222-7) improved some initial outcomes, without improving average exam performance. That distinction motivates testing independent performance after the lesson, not just understanding while reading it.

[Roediger and Karpicke's retrieval experiments](https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf) studied prose learning and delayed recall. Applying that result to reconstructing algorithms is an extrapolation. Likewise, the [interleaving study cited in the book](https://files.eric.ed.gov/fulltext/ED595322.pdf) concerns mathematics instruction, not a direct trial of coding-interview practice.

The practical recommendation is to distinguish immediate assisted success, delayed reconstruction, and transfer to a new problem. Track each one. Revisit intervals in the guide are starting rules, not scientifically established optima.

## System-design references reviewed

| Reference | Material reviewed | What it contributes here |
| --- | --- | --- |
| [SystemDesign Academy: LRU cache](https://www.systemdesign.academy/lld/lru-cache) | The public LRU lesson. | A reference point for connecting requirements, objects, operations, and extensions. Our lab adds explicit state checks and comparison against an independent implementation. |
| [ByteByteGo: foreword](https://bytebytego.com/courses/system-design-interview/foreword) | The public foreword, not the full course. | Open-ended requirements, communication, bottlenecks, and tradeoffs as the frame for a design discussion. |
| [Hello Interview: file-system design](https://www.hellointerview.com/community/questions/file-system-design/cm5eguhab02gq838obxubceit) | The public community question and visible discussion. | Concrete API and representation choices to compare. Community solutions can use different contracts, so our lesson states its own assumptions. |
| [ByteByteGo: file-search example](https://github.com/ByteByteGoHq/ood-interview/tree/main/file_search/filesearch) | Public README, traversal, and search-criteria implementation. | Separate traversal from composable predicates. Searching a tree is a different contract from implementing the file-system API. |
| [AlgoMaster: in-memory file system](https://algomaster.io/learn/dsa/design-in-memory-file-system) | Public explanation and approach overview; gated material was not reviewed. | Compare flat full-path storage with a hierarchy of path components, and trace operations on visible state. |

These are references for subject coverage and teaching choices. Our prose, models, and interactions are original. We have not evaluated every lesson on these sites or established that our first edition is more effective than their courses.

## Technical claims need their own evidence

The [patterns bibliography](/patterns/sources-and-further-reading/) links algorithm references and Rust documentation. The cache lesson also distinguishes a teaching implementation from production policies using the primary [Redis eviction documentation](https://redis.io/docs/latest/develop/reference/eviction/) and [Caffeine design notes](https://github.com/ben-manes/caffeine/wiki/Design).

The browser labs execute the same model modules printed in their lessons and imported by the automated tests. LRU tests compare short operation histories against an independent array model. File-system tests compare deterministic updates against full-path storage and check invalid operations. These tests provide implementation evidence, not proof that a curriculum produces learning gains.

## How to improve a lesson

Make a claim concrete enough to check. Specify the input and contract, explain the baseline and its bottleneck, justify the transformation, include the cost of keys and output, and find a counterexample to an attractive wrong approach. Then add a changed-requirement exercise that tests the same idea in a new setting.

For external material, link to the exact source and distinguish a source's statement from our inference. Preserve third-party attribution and licensing. A source being publicly readable is not permission to republish its entire course.
