"""Debug script to understand responsibility parsing."""

from services.resume_parser import ResumeParser

def debug_responsibility_parsing():
    """Debug the exact responsibility parsing flow."""
    parser = ResumeParser()
    
    # Test input with fragment issues
    test_text = """
EXPERIENCE

Technical Specialist
Worley Services Pvt. Ltd.
6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.

based solutions for secure data transfer.
Developed Python
• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
"""
    
    print("=" * 80)
    print("DEBUG: RESPONSIBILITY PARSING")
    print("=" * 80)
    
    # Extract the experience section
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
    
    # Parse the first block in detail
    if blocks:
        print("\n" + "=" * 50)
        print("PARSING FIRST BLOCK IN DETAIL")
        print("=" * 50)
        
        first_block = blocks[0]
        lines = [l.strip() for l in first_block.split('\n') if l.strip()]
        print(f"Lines after cleaning: {len(lines)}")
        
        for i, line in enumerate(lines):
            print(f"  {i}: {repr(line)}")
        
        # Parse this block
        entry = parser._parse_experience_block(first_block)
        print(f"\nParsed entry:")
        print(f"  Company: {repr(entry.get('company', ''))}")
        print(f"  Designation: {repr(entry.get('designation', ''))}")
        print(f"  Duration: {repr(entry.get('duration', ''))}")
        print(f"  Responsibilities ({len(entry.get('responsibilities', []))}):")
        for j, resp in enumerate(entry.get('responsibilities', []), 1):
            print(f"    {j}. {repr(resp)}")
        
        # Also parse the second block if it exists
        if len(blocks) > 1:
            print(f"\n" + "=" * 50)
            print("PARSING SECOND BLOCK IN DETAIL") 
            print("=" * 50)
            
            second_block = blocks[1]
            print("Second block content:")
            second_lines = [l.strip() for l in second_block.split('\n') if l.strip()]
            for i, line in enumerate(second_lines):
                print(f"  {i}: {repr(line)}")
            
            entry2 = parser._parse_experience_block(second_block)
            print(f"\nParsed entry:")
            print(f"  Company: {repr(entry2.get('company', ''))}")
            print(f"  Designation: {repr(entry2.get('designation', ''))}")
            print(f"  Duration: {repr(entry2.get('duration', ''))}")
            print(f"  Responsibilities ({len(entry2.get('responsibilities', []))}):")
            for j, resp in enumerate(entry2.get('responsibilities', []), 1):
                print(f"    {j}. {repr(resp)}")

if __name__ == "__main__":
    debug_responsibility_parsing()