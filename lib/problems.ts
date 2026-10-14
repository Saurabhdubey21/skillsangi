export type Difficulty = "easy" | "medium" | "hard";
export type Status = "not_started" | "attempted" | "solved" | "revisit";

export type Problem = {
  id: string; // unique and stable. Never rename it once students have progress saved.
  title: string;
  difficulty: Difficulty;
  leetcode?: string; // the slug from leetcode.com/problems/<slug>/
  gfg?: string; // link for the GFG button
  core?: boolean; // part of the must-do list
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  problems: Problem[];
};

export const leetcodeUrl = (slug: string) =>
  `https://leetcode.com/problems/${slug}/`;

// Opens a search limited to geeksforgeeks.org for this title.
const gfgSearch = (title: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(
    `site:geeksforgeeks.org ${title}`
  )}`;

// A row is: [title, level, leetcodeSlug?, 1 if must-do?]
// level: "e" = easy, "m" = medium, "h" = hard
type Row = [title: string, level: "e" | "m" | "h", slug?: string, core?: 1];

const levels = { e: "easy", m: "medium", h: "hard" } as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function build(prefix: string, rows: Row[]): Problem[] {
  return rows.map(([title, level, slug, core]) => ({
    id: `${prefix}-${slug ?? slugify(title)}`,
    title,
    difficulty: levels[level],
    leetcode: slug,
    gfg: gfgSearch(title),
    core: core === 1,
  }));
}

// The order below is the learning order shown to students.
export const topics: Topic[] = [
  {
    id: "basics",
    name: "C++ basics",
    description: "Input/output, loops, conditions and simple number problems.",
    problems: build("basics", [
      ["Print Hello World and take input/output", "e", undefined, 1],
      ["Check even or odd", "e"],
      ["Sum of first N natural numbers", "e"],
      ["Count digits in a number", "e"],
      ["Sum of digits of a number", "e", undefined, 1],
      ["Reverse a number", "e", undefined, 1],
      ["Reverse Integer", "m", "reverse-integer"],
      ["Palindrome Number", "e", "palindrome-number", 1],
      ["Armstrong number", "e"],
      ["Check prime number", "e", undefined, 1],
      ["Factorial of a number", "e"],
      ["Fibonacci series", "e"],
      ["GCD and LCM of two numbers", "e", undefined, 1],
      ["Swap two numbers without a third variable", "e"],
      ["Fizz Buzz", "e", "fizz-buzz"],
      ["Add Digits", "e", "add-digits"],
      ["Count Primes", "m", "count-primes"],
      ["Power of Two", "e", "power-of-two"],
      ["Number of 1 Bits", "e", "number-of-1-bits"],
    ]),
  },
  {
    id: "patterns",
    name: "Pattern printing",
    description: "Nested loops: stars, numbers and alphabet patterns.",
    problems: build("patterns", [
      ["Square star pattern", "e", undefined, 1],
      ["Hollow square pattern", "e"],
      ["Right-angled triangle of stars", "e", undefined, 1],
      ["Inverted right-angled triangle", "e"],
      ["Number triangle (1, 12, 123 ...)", "e"],
      ["Floyd's triangle", "e"],
      ["Alphabet triangle", "e"],
      ["Full pyramid of stars", "e", undefined, 1],
      ["Inverted pyramid", "e"],
      ["Hollow pyramid", "m"],
      ["Diamond pattern", "m", undefined, 1],
      ["Hollow diamond", "m"],
      ["Butterfly pattern", "m"],
      ["Number pyramid", "e"],
      ["Palindromic number pyramid", "m"],
      ["Pascal's Triangle", "e", "pascals-triangle", 1],
      ["Pascal's Triangle II", "e", "pascals-triangle-ii"],
    ]),
  },
  {
    id: "recursion",
    name: "Recursion and backtracking",
    description: "Base cases, the call stack, then choosing and undoing.",
    problems: build("rec", [
      ["Print 1 to N using recursion", "e", undefined, 1],
      ["Sum of first N numbers using recursion", "e"],
      ["Factorial using recursion", "e", undefined, 1],
      ["Sum of digits using recursion", "e"],
      ["Check palindrome string using recursion", "e"],
      ["Fibonacci Number", "e", "fibonacci-number", 1],
      ["Reverse String", "e", "reverse-string"],
      ["Pow(x, n)", "m", "powx-n", 1],
      ["Tower of Hanoi", "m"],
      ["Subsets", "m", "subsets", 1],
      ["Subsets II", "m", "subsets-ii"],
      ["Permutations", "m", "permutations", 1],
      ["Combination Sum", "m", "combination-sum", 1],
      ["Combination Sum II", "m", "combination-sum-ii"],
      ["Generate Parentheses", "m", "generate-parentheses", 1],
      ["Letter Combinations of a Phone Number", "m", "letter-combinations-of-a-phone-number"],
      ["Palindrome Partitioning", "m", "palindrome-partitioning"],
      ["Word Search", "m", "word-search"],
      ["N-Queens", "h", "n-queens"],
    ]),
  },
  {
    id: "stl",
    name: "C++ STL",
    description: "Vectors, pairs, sets, maps, priority queues and algorithms.",
    problems: build("stl", [
      ["Sort a vector of pairs by the second value", "e", undefined, 1],
      ["Count distinct elements using set", "e"],
      ["Frequency of each element using map", "e", undefined, 1],
      ["Use lower_bound and upper_bound on a sorted vector", "e"],
      ["Next Permutation", "m", "next-permutation", 1],
      ["Merge Intervals", "m", "merge-intervals", 1],
      ["Intersection of Two Arrays", "e", "intersection-of-two-arrays"],
      ["Sort Characters By Frequency", "m", "sort-characters-by-frequency"],
      ["Custom Sort String", "m", "custom-sort-string"],
      ["Top K Frequent Elements", "m", "top-k-frequent-elements", 1],
      ["Kth Largest Element in an Array", "m", "kth-largest-element-in-an-array", 1],
      ["Last Stone Weight", "e", "last-stone-weight"],
      ["K Closest Points to Origin", "m", "k-closest-points-to-origin"],
      ["Find Median from Data Stream", "h", "find-median-from-data-stream"],
    ]),
  },
  {
    id: "arrays",
    name: "Arrays",
    description: "Traversal, prefix sums, two pointers and in-place tricks.",
    problems: build("arrays", [
      ["Two Sum", "e", "two-sum", 1],
      ["Best Time to Buy and Sell Stock", "e", "best-time-to-buy-and-sell-stock", 1],
      ["Contains Duplicate", "e", "contains-duplicate"],
      ["Move Zeroes", "e", "move-zeroes", 1],
      ["Remove Duplicates from Sorted Array", "e", "remove-duplicates-from-sorted-array"],
      ["Merge Sorted Array", "e", "merge-sorted-array"],
      ["Majority Element", "e", "majority-element"],
      ["Missing Number", "e", "missing-number"],
      ["Single Number", "e", "single-number"],
      ["Rotate Array", "m", "rotate-array"],
      ["Sort Colors", "m", "sort-colors", 1],
      ["Product of Array Except Self", "m", "product-of-array-except-self", 1],
      ["Maximum Subarray", "m", "maximum-subarray", 1],
      ["3Sum", "m", "3sum"],
      ["Container With Most Water", "m", "container-with-most-water"],
      ["Maximum Product Subarray", "m", "maximum-product-subarray"],
      ["Set Matrix Zeroes", "m", "set-matrix-zeroes"],
      ["Spiral Matrix", "m", "spiral-matrix"],
      ["Rotate Image", "m", "rotate-image"],
      ["Find the Duplicate Number", "m", "find-the-duplicate-number"],
      ["Jump Game", "m", "jump-game"],
      ["Trapping Rain Water", "h", "trapping-rain-water"],
      ["First Missing Positive", "h", "first-missing-positive"],
    ]),
  },
  {
    id: "strings",
    name: "Strings",
    description: "Two pointers, sliding windows and string manipulation.",
    problems: build("strings", [
      ["Valid Palindrome", "e", "valid-palindrome", 1],
      ["Longest Common Prefix", "e", "longest-common-prefix"],
      ["Find the Index of the First Occurrence in a String", "e", "find-the-index-of-the-first-occurrence-in-a-string"],
      ["Is Subsequence", "e", "is-subsequence"],
      ["Add Binary", "e", "add-binary"],
      ["Reverse Words in a String", "m", "reverse-words-in-a-string", 1],
      ["String to Integer (atoi)", "m", "string-to-integer-atoi"],
      ["Zigzag Conversion", "m", "zigzag-conversion"],
      ["Longest Palindromic Substring", "m", "longest-palindromic-substring", 1],
      ["Palindromic Substrings", "m", "palindromic-substrings"],
      ["Multiply Strings", "m", "multiply-strings"],
      ["Count and Say", "m", "count-and-say"],
      ["Longest Repeating Character Replacement", "m", "longest-repeating-character-replacement"],
    ]),
  },
  {
    id: "binary-search",
    name: "Binary search",
    description: "Searching sorted data, and searching on the answer.",
    problems: build("bs", [
      ["Binary Search", "e", "binary-search", 1],
      ["Search Insert Position", "e", "search-insert-position", 1],
      ["First Bad Version", "e", "first-bad-version"],
      ["Sqrt(x)", "e", "sqrtx"],
      ["Valid Perfect Square", "e", "valid-perfect-square"],
      ["Guess Number Higher or Lower", "e", "guess-number-higher-or-lower"],
      ["Search in Rotated Sorted Array", "m", "search-in-rotated-sorted-array", 1],
      ["Find First and Last Position of Element in Sorted Array", "m", "find-first-and-last-position-of-element-in-sorted-array", 1],
      ["Find Minimum in Rotated Sorted Array", "m", "find-minimum-in-rotated-sorted-array", 1],
      ["Find Peak Element", "m", "find-peak-element"],
      ["Search a 2D Matrix", "m", "search-a-2d-matrix"],
      ["Single Element in a Sorted Array", "m", "single-element-in-a-sorted-array"],
      ["Koko Eating Bananas", "m", "koko-eating-bananas", 1],
      ["Capacity To Ship Packages Within D Days", "m", "capacity-to-ship-packages-within-d-days"],
      ["Find K Closest Elements", "m", "find-k-closest-elements"],
      ["Time Based Key-Value Store", "m", "time-based-key-value-store"],
      ["Split Array Largest Sum", "h", "split-array-largest-sum"],
      ["Median of Two Sorted Arrays", "h", "median-of-two-sorted-arrays"],
    ]),
  },
  {
    id: "linked-lists",
    name: "Linked lists",
    description: "Pointer manipulation, fast and slow pointers, cycles and merging.",
    problems: build("ll", [
      ["Reverse Linked List", "e", "reverse-linked-list", 1],
      ["Linked List Cycle", "e", "linked-list-cycle", 1],
      ["Merge Two Sorted Lists", "e", "merge-two-sorted-lists", 1],
      ["Middle of the Linked List", "e", "middle-of-the-linked-list", 1],
      ["Palindrome Linked List", "e", "palindrome-linked-list"],
      ["Intersection of Two Linked Lists", "e", "intersection-of-two-linked-lists"],
      ["Remove Duplicates from Sorted List", "e", "remove-duplicates-from-sorted-list"],
      ["Delete Node in a Linked List", "m", "delete-node-in-a-linked-list"],
      ["Remove Linked List Elements", "e", "remove-linked-list-elements"],
      ["Remove Nth Node From End of List", "m", "remove-nth-node-from-end-of-list", 1],
      ["Add Two Numbers", "m", "add-two-numbers"],
      ["Linked List Cycle II", "m", "linked-list-cycle-ii"],
      ["Odd Even Linked List", "m", "odd-even-linked-list"],
      ["Swap Nodes in Pairs", "m", "swap-nodes-in-pairs"],
      ["Rotate List", "m", "rotate-list"],
      ["Reorder List", "m", "reorder-list"],
      ["Sort List", "m", "sort-list"],
      ["Copy List with Random Pointer", "m", "copy-list-with-random-pointer"],
      ["Reverse Nodes in k-Group", "h", "reverse-nodes-in-k-group"],
      ["Merge k Sorted Lists", "h", "merge-k-sorted-lists"],
    ]),
  },
  {
    id: "stacks",
    name: "Stacks",
    description: "Matching brackets, monotonic stacks and expression evaluation.",
    problems: build("stack", [
      ["Valid Parentheses", "e", "valid-parentheses", 1],
      ["Min Stack", "m", "min-stack", 1],
      ["Baseball Game", "e", "baseball-game"],
      ["Next Greater Element I", "e", "next-greater-element-i", 1],
      ["Remove All Adjacent Duplicates In String", "e", "remove-all-adjacent-duplicates-in-string"],
      ["Evaluate Reverse Polish Notation", "m", "evaluate-reverse-polish-notation"],
      ["Daily Temperatures", "m", "daily-temperatures", 1],
      ["Decode String", "m", "decode-string"],
      ["Asteroid Collision", "m", "asteroid-collision"],
      ["Simplify Path", "m", "simplify-path"],
      ["Online Stock Span", "m", "online-stock-span"],
      ["Car Fleet", "m", "car-fleet"],
      ["Remove K Digits", "m", "remove-k-digits"],
      ["Basic Calculator II", "m", "basic-calculator-ii"],
      ["Largest Rectangle in Histogram", "h", "largest-rectangle-in-histogram"],
    ]),
  },
  {
    id: "queues",
    name: "Queues and deques",
    description: "FIFO order, circular queues, BFS-style simulation and sliding windows.",
    problems: build("queue", [
      ["Implement Queue using Stacks", "e", "implement-queue-using-stacks", 1],
      ["Implement Stack using Queues", "e", "implement-stack-using-queues", 1],
      ["Number of Recent Calls", "e", "number-of-recent-calls"],
      ["Number of Students Unable to Eat Lunch", "e", "number-of-students-unable-to-eat-lunch"],
      ["Time Needed to Buy Tickets", "e", "time-needed-to-buy-tickets"],
      ["Design Circular Queue", "m", "design-circular-queue", 1],
      ["Design Circular Deque", "m", "design-circular-deque"],
      ["Dota2 Senate", "m", "dota2-senate"],
      ["Reveal Cards In Increasing Order", "m", "reveal-cards-in-increasing-order"],
      ["Rotting Oranges", "m", "rotting-oranges", 1],
      ["Sliding Window Maximum", "h", "sliding-window-maximum"],
    ]),
  },
  {
    id: "hashmaps",
    name: "Hashmaps",
    description: "Frequency counts, prefix sums and constant-time lookups.",
    problems: build("hash", [
      ["Valid Anagram", "e", "valid-anagram", 1],
      ["Group Anagrams", "m", "group-anagrams", 1],
      ["Ransom Note", "e", "ransom-note"],
      ["First Unique Character in a String", "e", "first-unique-character-in-a-string"],
      ["Isomorphic Strings", "e", "isomorphic-strings"],
      ["Word Pattern", "e", "word-pattern"],
      ["Intersection of Two Arrays II", "e", "intersection-of-two-arrays-ii"],
      ["Happy Number", "e", "happy-number"],
      ["Design HashMap", "e", "design-hashmap"],
      ["Longest Consecutive Sequence", "m", "longest-consecutive-sequence", 1],
      ["Subarray Sum Equals K", "m", "subarray-sum-equals-k", 1],
      ["Longest Substring Without Repeating Characters", "m", "longest-substring-without-repeating-characters", 1],
      ["Find All Anagrams in a String", "m", "find-all-anagrams-in-a-string"],
      ["4Sum II", "m", "4sum-ii"],
      ["Insert Delete GetRandom O(1)", "m", "insert-delete-getrandom-o1"],
      ["LRU Cache", "m", "lru-cache", 1],
      ["Minimum Window Substring", "h", "minimum-window-substring"],
    ]),
  },
  {
    id: "trees",
    name: "Trees",
    description: "Traversals, recursion on trees and binary search trees.",
    problems: build("trees", [
      ["Maximum Depth of Binary Tree", "e", "maximum-depth-of-binary-tree", 1],
      ["Invert Binary Tree", "e", "invert-binary-tree"],
      ["Same Tree", "e", "same-tree"],
      ["Symmetric Tree", "e", "symmetric-tree"],
      ["Diameter of Binary Tree", "e", "diameter-of-binary-tree"],
      ["Balanced Binary Tree", "e", "balanced-binary-tree"],
      ["Path Sum", "e", "path-sum"],
      ["Binary Tree Inorder Traversal", "e", "binary-tree-inorder-traversal", 1],
      ["Binary Tree Level Order Traversal", "m", "binary-tree-level-order-traversal", 1],
      ["Binary Tree Right Side View", "m", "binary-tree-right-side-view"],
      ["Validate Binary Search Tree", "m", "validate-binary-search-tree", 1],
      ["Kth Smallest Element in a BST", "m", "kth-smallest-element-in-a-bst"],
      ["Lowest Common Ancestor of a Binary Search Tree", "m", "lowest-common-ancestor-of-a-binary-search-tree"],
      ["Lowest Common Ancestor of a Binary Tree", "m", "lowest-common-ancestor-of-a-binary-tree", 1],
      ["Construct Binary Tree from Preorder and Inorder Traversal", "m", "construct-binary-tree-from-preorder-and-inorder-traversal"],
      ["Binary Tree Maximum Path Sum", "h", "binary-tree-maximum-path-sum"],
      ["Serialize and Deserialize Binary Tree", "h", "serialize-and-deserialize-binary-tree"],
    ]),
  },
  {
    id: "graphs",
    name: "Graphs",
    description: "BFS, DFS, grids, shortest paths and dependency ordering.",
    problems: build("graphs", [
      ["Flood Fill", "e", "flood-fill"],
      ["Find if Path Exists in Graph", "e", "find-if-path-exists-in-graph"],
      ["Number of Islands", "m", "number-of-islands", 1],
      ["Max Area of Island", "m", "max-area-of-island"],
      ["Number of Provinces", "m", "number-of-provinces", 1],
      ["Clone Graph", "m", "clone-graph"],
      ["Course Schedule", "m", "course-schedule", 1],
      ["Course Schedule II", "m", "course-schedule-ii"],
      ["Pacific Atlantic Water Flow", "m", "pacific-atlantic-water-flow"],
      ["Surrounded Regions", "m", "surrounded-regions"],
      ["Is Graph Bipartite?", "m", "is-graph-bipartite"],
      ["Shortest Path in Binary Matrix", "m", "shortest-path-in-binary-matrix"],
      ["Redundant Connection", "m", "redundant-connection"],
      ["Network Delay Time", "m", "network-delay-time", 1],
      ["Cheapest Flights Within K Stops", "m", "cheapest-flights-within-k-stops"],
      ["Word Ladder", "h", "word-ladder"],
    ]),
  },
  {
    id: "dp",
    name: "Dynamic programming",
    description: "Break problems into overlapping subproblems.",
    problems: build("dp", [
      ["Climbing Stairs", "e", "climbing-stairs", 1],
      ["Min Cost Climbing Stairs", "e", "min-cost-climbing-stairs"],
      ["House Robber", "m", "house-robber", 1],
      ["House Robber II", "m", "house-robber-ii"],
      ["Unique Paths", "m", "unique-paths", 1],
      ["Coin Change", "m", "coin-change", 1],
      ["Longest Increasing Subsequence", "m", "longest-increasing-subsequence", 1],
      ["Longest Common Subsequence", "m", "longest-common-subsequence", 1],
      ["Word Break", "m", "word-break"],
      ["Decode Ways", "m", "decode-ways"],
      ["Partition Equal Subset Sum", "m", "partition-equal-subset-sum"],
      ["Target Sum", "m", "target-sum"],
      ["Combination Sum IV", "m", "combination-sum-iv"],
      ["Edit Distance", "h", "edit-distance"],
    ]),
  },
];

// Places to practise language basics. Check each one before launch.
export const languageResources = [
  { name: "LearnCpp", url: "https://www.learncpp.com/", note: "A free, step-by-step C++ tutorial from the basics up." },
  { name: "HackerRank", url: "https://www.hackerrank.com/", note: "Beginner tracks and small problems in many languages." },
  { name: "Exercism", url: "https://exercism.org/", note: "Free exercises for each language, with optional mentor feedback." },
  { name: "CodeChef Practice", url: "https://www.codechef.com/practice", note: "Beginner problems sorted by difficulty." },
];