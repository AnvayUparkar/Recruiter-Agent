"""Debug script to understand the Accenture responsibility parsing issue."""

from services.resume_parser import ResumeParser

def debug_accenture_parsing():
    """Debug the Accenture responsibility parsing specifically."""
    parser = ResumeParser()
    
    # Test input with Accenture fragment issues
    test_text = """
EXPERIENCE

Associate Manager
Accenture Services Pvt. Ltd.
12 Years

quality solutions aligned with business requirements.
Delivered custom software development projects for U.S. clients, ensuring high
• Led cross-functional teams of 15+ members, driving successful project execution and maintaining high client satisfaction.
"""
    
    print("=" * 80)
    print("DEBUG: ACCENTURE RESPONSIBILITY PARSING")
    print("=" * 80)
    
    # Extract and parse
    sections = parser._intelligent_section_split(test_text)
    exp_text = sections.get("experience", "")
    
    print("Experience text found:")
    print(repr(exp_text))
    print()
    
    # Split into blocks
    blocks = parser._split_experience_blocks(exp_text)
    print(f"Experience blocks found: {len(blocks)}")
    
    for i, block in enumerate(blocks, 1):
        print(f"\nBlock {i}:")
        print(repr(block))
        print("Block content:")
        for line_num, line in enumerate(block.split('\n'), 1):
            print(f"  {line_num}: {repr(line)}")
        
        # Parse this block
        entry = parser._parse_experience_block(block)
        print(f"\nParsed entry:")
        print(f"  Company: {repr(entry.get('company', ''))}")
        print(f"  Designation: {repr(entry.get('designation', ''))}")
        print(f"  Duration: {repr(entry.get('duration', ''))}")
        print(f"  Responsibilities ({len(entry.get('responsibilities', []))}):")
        for j, resp in enumerate(entry.get('responsibilities', []), 1):
            print(f"    {j}. {repr(resp)}")

if __name__ == "__main__":
    debug_accenture_parsing()