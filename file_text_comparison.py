#!/usr/bin/env python3
"""
File Text Comparison Script

Compares two files and identifies:
- Lines/text present in file1 but not in file2
- Lines/text present in file2 but not in file1
- Common lines present in both files
"""

import argparse
import sys
from pathlib import Path


def read_file_lines(filepath: str) -> set[str]:
    """Read a file and return a set of non-empty lines (stripped of whitespace)."""
    path = Path(filepath)
    if not path.exists():
        print(f"Error: File '{filepath}' does not exist.")
        sys.exit(1)

    with open(path, 'r', encoding='utf-8') as f:
        # Strip whitespace and filter empty lines
        lines = {line.strip() for line in f if line.strip()}
    return lines


def compare_files(file1: str, file2: str, show_common: bool = False) -> None:
    """Compare two files and print the differences."""
    lines1 = read_file_lines(file1)
    lines2 = read_file_lines(file2)

    # Find differences
    only_in_file1 = lines1 - lines2
    only_in_file2 = lines2 - lines1
    common = lines1 & lines2

    # Print results
    print(f"\n{'='*60}")
    print(f"Comparing: {file1} vs {file2}")
    print(f"{'='*60}\n")

    print(f"📄 Lines in '{file1}': {len(lines1)}")
    print(f"📄 Lines in '{file2}': {len(lines2)}")
    print(f"✅ Common lines: {len(common)}")
    print()

    if only_in_file1:
        print(f"🔴 Text ONLY in '{file1}' ({len(only_in_file1)} lines):")
        print("-" * 40)
        for line in sorted(only_in_file1):
            print(f"  {line}")
        print()
    else:
        print(f"✅ No unique text in '{file1}' - all lines exist in '{file2}'")
        print()

    if only_in_file2:
        print(f"🔵 Text ONLY in '{file2}' ({len(only_in_file2)} lines):")
        print("-" * 40)
        for line in sorted(only_in_file2):
            print(f"  {line}")
        print()
    else:
        print(f"✅ No unique text in '{file2}' - all lines exist in '{file1}'")
        print()

    if show_common and common:
        print(f"🟢 Common text in BOTH files ({len(common)} lines):")
        print("-" * 40)
        for line in sorted(common):
            print(f"  {line}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Compare two files and find text differences",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s file1.txt file2.txt
  %(prog)s file1.txt file2.txt --show-common
  %(prog)s config1.json config2.json
        """
    )
    parser.add_argument("file1", help="First file to compare")
    parser.add_argument("file2", help="Second file to compare")
    parser.add_argument(
        "--show-common", "-c",
        action="store_true",
        help="Also show lines that are common to both files"
    )

    args = parser.parse_args()
    compare_files(args.file1, args.file2, args.show_common)


if __name__ == "__main__":
    main()
