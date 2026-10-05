// SPDX-License-Identifier: MIT
// Independent exhaustive checks for the code extracted from the manuscript.
fn arrays(alphabet: &[i32], max_len: usize, mut visit: impl FnMut(&[i32])) {
    fn walk(a: &mut Vec<i32>, alphabet: &[i32], max_len: usize,
            visit: &mut impl FnMut(&[i32])) {
        visit(a);
        if a.len() == max_len { return; }
        for &x in alphabet {
            a.push(x);
            walk(a, alphabet, max_len, visit);
            a.pop();
        }
    }
    walk(&mut Vec::new(), alphabet, max_len, &mut visit);
}

#[test]
fn two_sum_matches_pair_enumeration() {
    arrays(&[-2, -1, 0, 1, 2], 6, |a| {
        for target in -4..=4 {
            let exists = (0..a.len()).any(|i|
                (i + 1..a.len()).any(|j| a[i] + a[j] == target));
            let answer = two_sum(a, target);
            assert_eq!(answer.is_some(), exists, "{a:?} {target}");
            if let Some((i, j)) = answer {
                assert!(i < j && j < a.len());
                assert_eq!(a[i] + a[j], target);
            }
        }
    });
    assert_eq!(two_sum(&[i32::MIN, i32::MAX], -1), Some((0, 1)));
}

#[test]
fn prefix_counts_match_range_enumeration() {
    arrays(&[-2, -1, 0, 1, 2], 6, |a| {
        for k in -3..=3 {
            let mut expected = 0;
            for l in 0..a.len() {
                for r in l + 1..=a.len() {
                    if a[l..r].iter().map(|&x| i64::from(x)).sum::<i64>() == k {
                        expected += 1;
                    }
                }
            }
            assert_eq!(count_sum(a, k), expected, "{a:?} {k}");
        }
    });
    assert_eq!(count_sum(&[1, 2], i64::MIN), 0);
    assert_eq!(count_sum(&[-1, -2], i64::MAX), 0);
}

#[test]
fn positive_windows_match_all_ranges() {
    arrays(&[1, 2, 3], 7, |a| {
        for target in 1..=12 {
            let mut expected = None;
            for l in 0..a.len() {
                for r in l + 1..=a.len() {
                    if a[l..r].iter().map(|&x| i64::from(x)).sum::<i64>() >= target {
                        let n = r - l;
                        expected = Some(expected.map_or(n, |old: usize| old.min(n)));
                    }
                }
            }
            assert_eq!(min_len_positive(a, target), expected, "{a:?} {target}");
        }
    });
}

#[test]
fn boundary_search_covers_every_monotone_boolean_domain() {
    for n in 0..=200 {
        for boundary in 0..=n {
            let result = first_true(n, |i| {
                assert!(i < n);
                i >= boundary
            });
            assert_eq!(result, boundary);
        }
    }
}

#[test]
fn kth_largest_matches_sorting() {
    arrays(&[-2, -1, 0, 1, 2], 6, |a| {
        let mut ordered = a.to_vec();
        ordered.sort_unstable_by(|a, b| b.cmp(a));
        assert_eq!(kth_largest(a, 0), None);
        assert_eq!(kth_largest(a, a.len() + 1), None);
        for k in 1..=a.len() {
            assert_eq!(kth_largest(a, k), Some(ordered[k - 1]));
        }
    });
}

#[test]
fn interval_greedy_matches_subset_search() {
    let universe: Vec<(i32, i32)> = (0..4)
        .flat_map(|s| (s + 1..=4).map(move |e| (s, e))).collect();
    for mask in 0_usize..1 << universe.len() {
        let chosen: Vec<_> = universe.iter().enumerate()
            .filter(|(i, _)| mask & (1 << i) != 0).map(|(_, &v)| v).collect();
        let mut expected = 0;
        for subset in 0_usize..1 << chosen.len() {
            let picked: Vec<_> = chosen.iter().enumerate()
                .filter(|(i, _)| subset & (1 << i) != 0).map(|(_, &v)| v).collect();
            let compatible = (0..picked.len()).all(|i|
                (i + 1..picked.len()).all(|j|
                    picked[i].1 <= picked[j].0 || picked[j].1 <= picked[i].0));
            if compatible { expected = expected.max(picked.len()); }
        }
        assert_eq!(max_nonoverlap(&mut chosen.clone()), expected, "{chosen:?}");
    }
    assert_eq!(max_nonoverlap(&mut [(0, 1), (0, 1), (1, 2)]), 2);
}

#[test]
fn bfs_matches_all_pairs_relaxation() {
    let n = 4;
    let edges: Vec<_> = (0..n).flat_map(|u|
        (0..n).filter(move |&v| u != v).map(move |v| (u, v))).collect();
    for mask in 0_usize..1 << edges.len() {
        let mut adj = vec![vec![]; n];
        let mut d = vec![vec![100_usize; n]; n];
        for u in 0..n { d[u][u] = 0; }
        for (i, &(u, v)) in edges.iter().enumerate() {
            if mask & (1 << i) != 0 { adj[u].push(v); d[u][v] = 1; }
        }
        for k in 0..n { for u in 0..n { for v in 0..n {
            d[u][v] = d[u][v].min(d[u][k] + d[k][v]);
        } } }
        for start in 0..n {
            let expected: Vec<_> = d[start].iter()
                .map(|&x| if x == 100 { None } else { Some(x) }).collect();
            assert_eq!(bfs_dist(&adj, start), expected);
        }
    }
}

#[test]
fn robbery_matches_nonadjacent_subset_search() {
    arrays(&[0, 1, 2, 3], 7, |a| {
        let mut expected = 0;
        for mask in 0_usize..1 << a.len() {
            if mask & (mask << 1) != 0 { continue; }
            let score = a.iter().enumerate().filter(|(i, _)| mask & (1 << i) != 0)
                .map(|(_, &v)| i64::from(v)).sum();
            expected = expected.max(score);
        }
        assert_eq!(rob(a), expected, "{a:?}");
    });
}
