"""Test script for name extraction issues."""

from services.resume_parser import ResumeParser

def test_name_extraction():
    """Test name extraction with the specific format from the screenshot."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("NAME EXTRACTION TEST")
    print("=" * 80)
    
    # Test the exact format from your screenshot
    test_text = """
Name                                                                                                            Achievements

Anvay_Uparkar

Bachelor of Technology, Artificial Intelligence & Data Science [4th Year]
Shah & Anchor Kutchhi Engineering College, Chembur

Achievements

•Runner Up at GITAM Deemed to be University IASF Project Showcase-Bangalore
"""
    
    print("INPUT TEXT:")
    print("-" * 40)
    print(test_text[:300] + "...")
    print("-" * 40)
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"\nEXTRACTED NAME: '{parsed.name}'")
    print(f"EXTRACTED EMAIL: '{parsed.email}'")
    print(f"EXTRACTED PHONE: '{parsed.phone}'")
    
    print("\nANALYSIS:")
    print("=" * 40)
    
    expected_name = "Anvay Uparkar"
    
    if parsed.name:
        if "anvay" in parsed.name.lower() and "uparkar" in parsed.name.lower():
            print("✓ Name contains correct components")
            if "_" in parsed.name:
                print("⚠️  Name contains underscore - should be cleaned")
            else:
                print("✓ Name is properly formatted")
        else:
            print(f"✗ Name doesn't match expected: '{expected_name}'")
    else:
        print("✗ No name extracted")
    
    # Test individual lines to see what the parser sees
    print(f"\nLINE-BY-LINE ANALYSIS:")
    lines = [line.strip() for line in test_text.split('\n') if line.strip()]
    for i, line in enumerate(lines[:8]):
        name_result = parser._extract_name_from_line(line) if hasattr(parser, '_extract_name_from_line') else "N/A"
        print(f"  Line {i+1}: '{line}' -> Name: {name_result}")

def test_name_variations():
    """Test various name formats that might appear in resumes."""
    parser = ResumeParser()
    
    print(f"\n{'='*80}")
    print("NAME VARIATION TESTS")
    print("="*80)
    
    test_cases = [
        ("Anvay_Uparkar", "Standard underscore format"),
        ("Anvay Uparkar", "Standard space format"),
        ("ANVAY UPARKAR", "All caps format"),
        ("Name: Anvay Uparkar", "With prefix"),
        ("John Michael Smith Jr.", "With suffix"),
        ("Dr. Anvay Uparkar", "With title"),
        ("Anvay K. Uparkar", "With middle initial"),
    ]
    
    for test_name, description in test_cases:
        test_text = f"""
RESUME

{test_name}

Software Engineer
Mumbai, India
Email: test@example.com
Phone: +91-1234567890
"""
        
        parsed = parser._extract_structured_data(test_text)
        result = parsed.name
        
        print(f"  {description:25} | Input: '{test_name:20}' | Output: '{result}'")

if __name__ == "__main__":
    print("Testing Name Extraction Issues\n")
    test_name_extraction()
    test_name_variations()