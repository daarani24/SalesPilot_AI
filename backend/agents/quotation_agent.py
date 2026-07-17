import os
import re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from rag.vector_store import get_catalog_store

GST_RATE = 0.18          
STUDENT_DISCOUNT = 0.05  

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_quotations")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def _extract_price(catalog_chunk: str) -> float | None:
    """
    Pulls the numeric price out of a catalog chunk like 'Price: ₹32,999'.
    Returns None if no price pattern is found (defensive -- catalog format
    could change, and we never want to silently quote ₹0).
    """
    match = re.search(r"Price:\s*₹([\d,]+)", catalog_chunk)
    if not match:
        return None
    return float(match.group(1).replace(",", ""))

def _extract_product_name(catalog_chunk: str) -> str:
    """Pulls the product name out of a catalog chunk like 'Product: TechHub Acer Aspire 3'."""
    match = re.search(r"Product:\s*(.+)", catalog_chunk)
    return match.group(1).strip() if match else "Unknown Product"

def find_product(product_query: str) -> dict | None:
    """
    Uses the same RAG search the Sales Agent uses, so quoted prices always
    match what the customer was told earlier in the conversation -- one
    single source of truth for pricing, not two systems that could drift apart.
    """
    results = get_catalog_store().search(product_query, top_k=1)
    if not results:
        return None

    chunk = results[0]
    price = _extract_price(chunk)
    if price is None:
        return None

    return {"name": _extract_product_name(chunk), "price": price}

def generate_quotation(
    customer_name: str,
    product_query: str,
    is_student: bool = False,
) -> dict:
    """
    Main entry point. Returns a dict with the calculation breakdown and the
    path to the generated PDF file, or an "error" key if the product wasn't found.
    """
    product = find_product(product_query)
    if product is None:
        return {"error": f"Could not find a matching product for '{product_query}' in the catalog."}

    base_price = product["price"]
    discount_amount = round(base_price * STUDENT_DISCOUNT, 2) if is_student else 0.0
    price_after_discount = base_price - discount_amount
    tax_amount = round(price_after_discount * GST_RATE, 2)
    total = round(price_after_discount + tax_amount, 2)

    breakdown = {
        "customer_name": customer_name,
        "product_name": product["name"],
        "base_price": base_price,
        "discount_applied": is_student,
        "discount_amount": discount_amount,
        "tax_amount": tax_amount,
        "total": total,
        "date": datetime.now().strftime("%d %B %Y"),
    }

    pdf_path = _render_pdf(breakdown)
    breakdown["pdf_path"] = pdf_path
    return breakdown

def _render_pdf(breakdown: dict) -> str:
    """Builds the actual PDF file using reportlab. Pure formatting, no business logic here."""
    safe_name = re.sub(r"[^\w\-]", "_", breakdown["customer_name"])
    filename = f"quotation_{safe_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(OUTPUT_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=20 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1a1a2e"))

    elements = []
    elements.append(Paragraph("TechHub Computers", title_style))
    elements.append(Paragraph("Official Price Quotation", styles["Heading2"]))
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(f"Customer: {breakdown['customer_name']}", styles["Normal"]))
    elements.append(Paragraph(f"Date: {breakdown['date']}", styles["Normal"]))
    elements.append(Spacer(1, 8 * mm))

    table_data = [
        ["Description", "Amount (₹)"],
        [breakdown["product_name"], f"{breakdown['base_price']:,.2f}"],
    ]
    if breakdown["discount_applied"]:
        table_data.append(["Student Discount (5%)", f"-{breakdown['discount_amount']:,.2f}"])
    table_data.append(["GST (18%)", f"{breakdown['tax_amount']:,.2f}"])
    table_data.append(["TOTAL", f"{breakdown['total']:,.2f}"])

    table = Table(table_data, colWidths=[110 * mm, 50 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.grey),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.grey),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(
        "This quotation is valid for 7 days. Prices include applicable taxes as shown.",
        styles["Italic"],
    ))

    doc.build(elements)
    return filepath

if __name__ == "__main__":
    
    result = generate_quotation(
        customer_name="Ravi Kumar",
        product_query="Acer Aspire 3 laptop",
        is_student=True,
    )
    print(result)