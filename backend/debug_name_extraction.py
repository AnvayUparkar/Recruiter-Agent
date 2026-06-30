"""Debug name extraction issue."""

from services.resume_parser import ResumeParser

def debug_name_extraction():
    """Debug name extraction from the test resume."""
    parser = ResumeParser()
    
    test_text = """
Name        Achievements
Anvay_Uparkar               Best Student Award 2023

CONTACT
Email: anvayuparkar@gmail.com
Phone: +91-9702017203
"""
    
    print("DEBUG: Name Extraction")
    print("=" * 40)
    
    print("Input text lines:")
    lines = [line.strip() for line in test_text.split('\n') if line.strip()]
    for i, line in enumerate(lines):
        print(f"  {i}: {repr(line)}")
    
    extracted_name = parser._extract_name(test_text)
    print(f"\nExtracted name: {repr(extracted_name)}")

if __name__ == "__main__":
    debug_name_extraction()