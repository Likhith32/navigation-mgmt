import re
import os
import markdown
from fpdf import FPDF

# Custom PDF class for IEEE styling
class IEEEPDF(FPDF):
    def header(self):
        # Running header on subsequent pages
        if self.page_no() > 1:
            self.set_font("times", "I", 8)
            self.set_text_color(80, 80, 80)
            self.cell(0, 10, "IEEE Digital Twin Campus Navigation & Spatial Management Platform", align="C")
            self.ln(10)
            self.set_draw_color(180, 180, 180)
            self.set_line_width(0.2)
            self.line(20, 18, 190, 18)
            self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("times", "", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def make_latin1_safe(text):
    """
    Translates common non-latin-1 mathematical symbols and characters
    to readable ASCII/latin-1 equivalents, avoiding FPDF rendering crashes.
    """
    unicode_map = {
        ord('∈'): ' in ',
        ord('⊆'): ' subset of ',
        ord('≠'): ' != ',
        ord('∪'): ' union ',
        ord('Δ'): 'd_',
        ord('ϕ'): 'phi',
        ord('λ'): 'lambda',
        ord('φ'): 'phi',
        ord('•'): ' - ',
        ord('²'): '^2',
        ord('√'): 'sqrt',
        ord('—'): ' - ',
        ord('–'): ' - ',
        ord('’'): "'",
        ord('“'): '"',
        ord('”'): '"',
        ord('◈'): ' * ',
        ord('⟡'): ' * ',
        ord('◎'): ' * ',
        ord('⚡'): ' [Emergency] ',
        ord('🚪'): ' [Entrance] ',
        ord('🛏'): ' [Bed] ',
        ord('📺'): ' [TV] ',
        ord('🚿'): ' [Shower] ',
        ord('🪜'): ' [Stairs] ',
        ord('🚶'): ' [Walk] ',
        ord('🏢'): ' [Building] ',
        ord('📚'): ' [Study] ',
        ord('⚙'): ' [Gear] ',
        ord('🏠'): ' [Hostel] ',
        ord('🎓'): ' [Academic] ',
        ord('⌂'): ' [Home] ',
        ord('⬡'): ' * ',
        ord('⬆'): ' [Up] ',
        ord('✕'): ' x ',
        ord('♿'): ' [Accessible] ',
        ord('✅'): ' [OK] ',
        ord('⚠'): ' [Warning] ',
        ord('\ufe0f'): ''
    }
    
    text = text.translate(unicode_map)
    
    # Strip any remaining character outside latin-1 (0-255)
    safe_chars = []
    for char in text:
        if ord(char) <= 255:
            safe_chars.append(char)
        else:
            # Fallback to similar-looking character or question mark
            safe_chars.append('?')
    return "".join(safe_chars)

def clean_markdown_math(md_content):
    """
    Cleans LaTeX mathematical formulas into standard Latin-1 text representation
    so they render beautifully in standard PDF fonts without math engines.
    """
    # Replace block equations
    md_content = md_content.replace(r"$$\text{lerp}(a, b, t) = a + (b - a) \cdot t$$", "lerp(a, b, t) = a + (b - a) * t")
    md_content = md_content.replace(
        r"$$\text{bilerp2D}(u, v) = \text{lerp}\Big(\text{lerp}(P_{NW}, P_{NE}, u), \text{lerp}(P_{SW}, P_{SE}, u), v\Big)$$",
        "bilerp2D(u, v) = lerp(lerp(P_NW, P_NE, u), lerp(P_SW, P_SE, u), v)"
    )
    md_content = md_content.replace(r"$$\mathcal{G} = (\mathcal{V}, \mathcal{E})$$", "G = (V, E)")
    md_content = md_content.replace(r"$$e_j = (v_a, v_b, d_m, \text{accessible} \in \{\text{true}, \text{false}\})$$", "e_j = (v_a, v_b, d_m, accessible in {true, false})")
    
    # Match the haversine equations individually
    md_content = md_content.replace(r"$$\Delta \phi = \text{lat}_T - \text{lat}_n,\quad \Delta \lambda = \text{lng}_T - \text{lng}_n$$", "d_phi = lat_T - lat_n,   d_lambda = lng_T - lng_n")
    md_content = md_content.replace(r"$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\text{lat}_n) \cdot \cos(\text{lat}_T) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$", "a = sin^2(d_phi/2) + cos(lat_n) * cos(lat_T) * sin^2(d_lambda/2)")
    md_content = md_content.replace(r"$$c = 2 \cdot \arctan2\left(\sqrt{a}, \sqrt{1 - a}\right)$$", "c = 2 * arctan2(sqrt(a), sqrt(1 - a))")
    md_content = md_content.replace(r"$$h(n) = R \cdot c$$", "h(n) = R * c")

    md_content = md_content.replace(r"$$f(n) = g(n) + h(n)$$", "f(n) = g(n) + h(n)")
    
    md_content = md_content.replace(
        r"$$\text{Segment}_1 = \text{aStar}(v_{\text{start}}, C_{\text{start}})$$ \n   $$\text{Segment}_2 = \text{aStar}(C_{\text{target}}, v_{\text{target}})$$ \n   $$\text{Path} = \big[ \text{Segment}_1 \big] \cup \big[ \text{Segment}_2 \big]$$",
        "Segment_1 = aStar(v_start, C_start)\nSegment_2 = aStar(C_target, v_target)\nPath = Segment_1 union Segment_2"
    )
    md_content = md_content.replace(r"$$\mathcal{R}_{\text{filtered}} = \{ r \in \mathcal{R} \mid \mathcal{A}_{\text{query}} \subseteq r.\text{attributes} \}$$", "R_filtered = { r in R | A_query in r.attributes }")

    # Replace inline equations
    md_content = md_content.replace(r"$\text{lerp}(a,b,t) = a + (b-a)t$", "lerp(a, b, t) = a + (b - a) * t")
    md_content = md_content.replace(r"$\text{bilerp2D}(NW, NE, SE, SW, u, v) = \text{lerp}(\text{lerp}(NW, NE, u), \text{lerp}(SW, SE, u), v)$", "bilerp2D(NW, NE, SE, SW, u, v) = lerp(lerp(NW, NE, u), lerp(SW, SE, u), v)")
    md_content = md_content.replace(r"$(u,v)$", "(u, v)")
    md_content = md_content.replace(r"$\mathcal{G} = (\mathcal{V}, \mathcal{E})$", "G = (V, E)")
    md_content = md_content.replace(r"$v_i \in \mathcal{V}$", "v_i in V")
    md_content = md_content.replace(r"$(\text{lat}_i, \text{lng}_i)$", "(lat_i, lng_i)")
    md_content = md_content.replace(r"$e_j \in \mathcal{E}$", "e_j in E")
    md_content = md_content.replace(r"$d_m$", "d_m")
    md_content = md_content.replace(r"$e_j = (v_a, v_b, d_m, \text{accessible} \in \{\text{true}, \text{false}\})$", "e_j = (v_a, v_b, d_m, accessible in {true, false})")
    md_content = md_content.replace(r"$h(n)$", "h(n)")
    md_content = md_content.replace(r"$f(n) = g(n) + h(n)$", "f(n) = g(n) + h(n)")
    md_content = md_content.replace(r"$g(n)$", "g(n)")
    md_content = md_content.replace(r"$f_{\text{start}} \neq f_{\text{target}}$", "f_start != f_target")
    md_content = md_content.replace(r"$C_{\text{start}}$", "C_start")
    md_content = md_content.replace(r"$C_{\text{target}}$", "C_target")
    md_content = md_content.replace(r"$v_{\text{start}}$", "v_start")
    md_content = md_content.replace(r"$v_{\text{target}}$", "v_target")
    md_content = md_content.replace(r"$e_{\text{accessible}} = \text{false}$", "e_accessible = false")
    md_content = md_content.replace(r"$\mathcal{R}_{\text{filtered}} = \{ r \in \mathcal{R} \mid \mathcal{A}_{\text{query}} \subseteq r.\text{attributes} \}$", "R_filtered = { r in R | A_query in r.attributes }")
    md_content = md_content.replace(r"$\mathcal{R}_{\text{filtered}}$", "R_filtered")
    md_content = md_content.replace(r"$\mathcal{R}$", "R")

    # Let the make_latin1_safe translator do a final pass to secure everything
    md_content = make_latin1_safe(md_content)
    
    return md_content

def convert_md_to_html(md_path):
    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Clean the math notations before markdown parses it
    md_content = clean_markdown_math(md_content)

    # Use python's markdown package to compile to HTML
    # We load standard extensions to parse tables and lists accurately
    html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'def_list'])

    # Wrap in simple HTML tags with Times styles suitable for fpdf2
    # fpdf2's write_html understands standard inline styling
    styled_html = f"""
    <font face="times" size="10">
    {html_content}
    </font>
    """
    
    # Custom post-processing of HTML to make sure headings have explicit sizes and linebreaks
    # fpdf2 write_html maps <h1> to very large size, we want standard academic sizes
    styled_html = styled_html.replace("<h1>", '<font size="16"><b><center>')
    styled_html = styled_html.replace("</h1>", "</center></b></font><br/>")
    styled_html = styled_html.replace("<h2>", '<br/><br/><font size="12"><b>')
    styled_html = styled_html.replace("</h2>", "</b></font><br/>")
    styled_html = styled_html.replace("<h3>", '<br/><font size="11"><b><i>')
    styled_html = styled_html.replace("</h3>", "</i></b></font><br/>")
    
    # Clean up double breaks or unstyled parts
    styled_html = styled_html.replace("<p>", '<p align="justify">')
    
    # Format table style so fpdf2 writes it with clean cell spacings
    styled_html = styled_html.replace("<table>", '<table border="1" width="100%">')
    
    return styled_html

def generate_pdf(md_path, pdf_path):
    print("Converting Markdown to styled HTML...")
    html_content = convert_md_to_html(md_path)

    print("Initializing FPDF Document...")
    # Margins: 20mm left/right, 20mm top, 20mm bottom
    pdf = IEEEPDF(orientation="portrait", unit="mm", format="A4")
    pdf.set_margins(left=20, top=20, right=20)
    pdf.set_auto_page_break(auto=True, margin=20)
    
    # Add first page
    pdf.add_page()
    
    # Set default text color (Pure Black)
    pdf.set_text_color(0, 0, 0)
    
    print("Writing HTML content to PDF...")
    # fpdf2's write_html natively compiles simple tables, paragraphs, lists, bold, italics!
    pdf.write_html(html_content)
    
    print(f"Saving PDF to: {pdf_path}")
    pdf.output(pdf_path)
    print("PDF Generation complete!")

if __name__ == "__main__":
    WORKSPACE_DIR = r"c:\Users\gjsjn\Downloads\navigation-mgmt"
    DOWNLOADS_DIR = r"C:\Users\gjsjn\Downloads"
    
    # Compile Target 1: IEEE Project Paper
    md_file1 = os.path.join(WORKSPACE_DIR, "IEEE_Project_Paper.md")
    pdf_file1 = os.path.join(DOWNLOADS_DIR, "IEEE_Project_Paper.pdf")
    if os.path.exists(md_file1):
        generate_pdf(md_file1, pdf_file1)
        
    # Compile Target 2: IoT Integration Blueprint
    md_file2 = os.path.join(WORKSPACE_DIR, "IoT_Integration_Blueprint.md")
    pdf_file2 = os.path.join(DOWNLOADS_DIR, "IoT_Integration_Blueprint.pdf")
    if os.path.exists(md_file2):
        generate_pdf(md_file2, pdf_file2)
