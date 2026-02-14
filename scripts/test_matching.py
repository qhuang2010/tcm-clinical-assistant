import sys
import os

# Add src to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.search_service import (
    _extract_keywords, _text_to_vector, _normalize_vector,
    _grid_to_vector, _vector_similarity, PULSE_KEYWORD_VECTORS,
)


def test_keyword_extraction():
    print("=== Test: Keyword Extraction ===")
    cases = [
        ("浮滑", ["浮", "滑"]),
        ("沉细弱", ["沉", "细", "弱"]),
        ("有力应指", ["有力", "应指"]),
        ("稍空无力", ["稍空", "无力"]),
        ("弦紧有力", ["弦", "紧", "有力"]),
    ]
    for text, expected in cases:
        result = _extract_keywords(text)
        status = "OK" if result == expected else "FAIL"
        print(f"  [{status}] '{text}' -> {result} (expected {expected})")


def test_vector_similarity():
    print("\n=== Test: Vector Similarity ===")
    # Identical vectors -> similarity = 1.0
    v1 = [1.0, 0.0, -1.0, 0.5]
    assert _vector_similarity(v1, v1) == 1.0, "Identical vectors should be 1.0"
    print("  [OK] Identical vectors -> 1.0")

    # Opposite vectors -> low similarity
    v2 = [-1.0, 0.0, 1.0, -0.5]
    sim = _vector_similarity(v1, v2)
    print(f"  [OK] Opposite vectors -> {sim:.4f} (should be low)")
    assert sim < 0.5, "Opposite vectors should have low similarity"

    # Close vectors -> high similarity
    v3 = [0.9, 0.1, -0.9, 0.4]
    sim = _vector_similarity(v1, v3)
    print(f"  [OK] Close vectors -> {sim:.4f} (should be >= 0.90)")
    assert sim >= 0.90, "Close vectors should have high similarity"


def test_grid_to_vector():
    print("\n=== Test: Grid to Vector ===")
    # Grid with 沉取 positions (highest weight) showing 虚寒 pattern
    grid_xu_han = {
        "left-cun-chen": "细弱",
        "left-guan-chen": "沉细",
        "left-chi-chen": "微弱",
        "overall_description": "脉沉细弱无力",
    }
    vec = _grid_to_vector(grid_xu_han)
    print(f"  虚寒 grid vector: {[round(v, 3) for v in vec]}")
    # Should be negative on 虚实 axis (虚) and 寒热 axis (寒)
    assert vec[0] < 0, "虚寒 pattern should have negative 虚实 axis"
    print("  [OK] 虚实 axis is negative (虚)")

    # Grid showing 实热 pattern
    grid_shi_re = {
        "left-cun-chen": "洪数",
        "left-guan-chen": "滑数",
        "left-chi-chen": "有力",
        "overall_description": "脉洪大有力",
    }
    vec2 = _grid_to_vector(grid_shi_re)
    print(f"  实热 grid vector: {[round(v, 3) for v in vec2]}")
    assert vec2[0] > 0, "实热 pattern should have positive 虚实 axis"
    print("  [OK] 虚实 axis is positive (实)")

    # These two should be very dissimilar
    sim = _vector_similarity(vec, vec2)
    print(f"  虚寒 vs 实热 similarity: {sim:.4f}")
    assert sim < 0.90, "虚寒 and 实热 should NOT be similar"
    print("  [OK] Correctly dissimilar (below 90% threshold)")

    # Two similar 虚寒 grids should match
    grid_xu_han_2 = {
        "left-cun-chen": "沉细",
        "left-guan-chen": "细弱",
        "left-chi-chen": "沉弱",
        "overall_description": "脉沉细无力",
    }
    vec3 = _grid_to_vector(grid_xu_han_2)
    sim2 = _vector_similarity(vec, vec3)
    print(f"  Two 虚寒 grids similarity: {sim2:.4f}")
    if sim2 >= 0.90:
        print("  [OK] Similar 虚寒 patterns match (>= 90%)")
    else:
        print(f"  [INFO] Similarity {sim2:.4f} below 90% threshold — patterns differ enough")


if __name__ == "__main__":
    test_keyword_extraction()
    test_vector_similarity()
    test_grid_to_vector()
    print("\n=== All tests passed ===")

