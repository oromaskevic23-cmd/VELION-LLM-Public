"""Order-preserving deduplication for hashable event IDs.

Source: NVIDIA Nemotron 3 Nano 4B genuinely generated the function during
GitHub Actions run 40671742769. Independently reviewed and verified.
No agent privileges, network calls or persistent customer state.
"""

def unique_in_order(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
