"""Test script to reproduce the experience fragmentation issue from the screenshot."""

from services.resume_parser import ResumeParser

def test_experience_fragmentation():
    """Test the specific fragmentation issue where descriptions become separate entries."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("EXPERIENCE FRAGMENTATION TEST")
    print("=" * 80)
    print("Reproducing the issue where experience descriptions are fragmented into separate entries")
    print()
    
    # Format that reproduces the fragmentation issue
    test_text = """
EXPERIENCE

Technical Specialist
Worley Services Pvt. Ltd.
6.5 Years
• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.

based solutions for secure data transfer.
Developed Python
• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
• Worked in Agile teams to ensure timely delivery.

Associate Manager
Accenture Services Pvt. Ltd.
12 Years

quality solutions aligned with business requirements.
Delivered custom software development projects for U.S. clients, ensuring high
• Led cross-functional teams of 15+ members, driving successful project execution and maintaining high client satisfaction.
• Implemented Agile/Scrum methodologies, improving team productivity and reducing project delivery timelines.
• Collaborated with stakeholders to define project scope, timelines, objectives, and deliverables.

EDUCATION
Bachelor of Technology
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"CURRENT RESULTS:")
    print(f"Experience entries: {len(parsed.experience)}")
    print()
    
    print("CURRENT EXPERIENCE ENTRIES:")
    for i, exp in enumerate(parsed.experience, 1):
        company = exp.get('company', 'N/A')
        designation = exp.get('designation', 'N/A')
        duration = exp.get('duration', 'N/A')
        responsibilities = exp.get('responsibilities', [])
        
        print(f"  {i}. Company: '{company}'")
        print(f"     Designation: '{designation}'")
        print(f"     Duration: '{duration}'")
        print(f"     Responsibilities ({len(responsibilities)} items):")
        for j, resp in enumerate(responsibilities, 1):
            print(f"       {j}. {resp}")
        print()
        print()
    
    print("ISSUE ANALYSIS:")
    print("=" * 40)
    
    # Check for fragmentation issues
    companies = [exp.get('company', '') for exp in parsed.experience]
    
    # Issues to detect:
    fragmentation_issues = []
    
    # Check if description fragments are treated as companies
    fragment_patterns = ['based solutions', 'developed python', 'quality solutions']
    for pattern in fragment_patterns:
        if any(pattern.lower() in company.lower() for company in companies):
            fragmentation_issues.append(f"'{pattern}' treated as company")
    
    # Check if we have the correct main companies
    has_worley = any('worley' in company.lower() for company in companies)
    has_accenture = any('accenture' in company.lower() for company in companies)
    
    if not has_worley:
        fragmentation_issues.append("Missing Worley Services")
    if not has_accenture:
        fragmentation_issues.append("Missing Accenture Services")
    
    # Check if we have too many entries (indication of fragmentation)
    expected_entries = 2
    if len(parsed.experience) > expected_entries:
        fragmentation_issues.append(f"Too many entries: {len(parsed.experience)} (expected {expected_entries})")
    
    print(f"Fragmentation issues found: {len(fragmentation_issues)}")
    for issue in fragmentation_issues:
        print(f"  ✗ {issue}")
    
    if not fragmentation_issues:
        print("  ✓ No fragmentation issues detected")
    
    print(f"\nEXPECTED BEHAVIOR:")
    print(f"Should have exactly 2 experience entries:")
    print(f"1. Worley Services Pvt. Ltd. - Technical Specialist (with all Python/AWS responsibilities)")
    print(f"2. Accenture Services Pvt. Ltd. - Associate Manager (with all management responsibilities)")
    
    success = len(fragmentation_issues) == 0
    print(f"\nRESULT: {'🎉 SUCCESS' if success else '❌ FRAGMENTATION DETECTED'}")
    
    return success

if __name__ == "__main__":
    print("Testing Experience Fragmentation Issues\n")
    test_experience_fragmentation()