"""
Tools and Function Calling definitions for Aura Voice Agent.
"""

from typing import Dict, Any
import re
from app.database import get_order_by_id, cancel_order_by_id, normalize_order_id


def get_order_details(order_id: str) -> Dict[str, Any]:
    """
    Look up order details by Order ID (e.g. ORD-101, ORD-102, ORD-103).
    Returns customer name, product, value, shipping status, tracking details, and notes.
    """
    if not order_id:
        return {
            "found": False,
            "error": "MISSING_ORDER_ID",
            "message": "Order ID was not provided. Please ask the customer for their Order ID (e.g., ORD-101)."
        }
        
    order = get_order_by_id(order_id)
    if not order:
        return {
            "found": False,
            "error": "NOT_FOUND",
            "order_id": order_id,
            "message": f"No order found with ID '{order_id}'. Could you please ask the customer to verify or repeat the order number?"
        }
        
    return {
        "found": True,
        "order_id": order["order_id"],
        "customer": order["customer"],
        "product": order["product"],
        "value": f"₹{order['value']}",
        "status": order["status"],
        "tracking_partner": order.get("tracking_partner"),
        "tracking_number": order.get("tracking_number"),
        "expected_delivery": order.get("expected_delivery"),
        "notes": order.get("notes"),
        "can_cancel": order.get("can_cancel", False)
    }


def cancel_order(order_id: str) -> Dict[str, Any]:
    """
    Attempt to cancel an order by Order ID.
    Per Aura Skincare policy, orders can only be cancelled while in 'Processing' status.
    """
    if not order_id:
        return {
            "success": False,
            "error": "MISSING_ORDER_ID",
            "message": "Order ID is required to cancel an order."
        }
    return cancel_order_by_id(order_id)


def check_pincode_serviceability(pincode: str) -> Dict[str, Any]:
    """
    Checks delivery ETA, courier partner, and COD availability for an Indian 6-digit pincode or city name.
    """
    from app.database import PINCODE_SERVICEABILITY
    
    clean_pin = re.sub(r'[^0-9]', '', str(pincode)).strip()
    
    # Direct match in directory
    if clean_pin in PINCODE_SERVICEABILITY:
        info = PINCODE_SERVICEABILITY[clean_pin]
        return {
            "serviceable": True,
            "pincode": clean_pin,
            "city": info["city"],
            "state": info["state"],
            "delivery_eta": info["eta"],
            "courier_partner": info["partner"],
            "cod_available": info["cod_available"],
            "message": f"Great news! Pincode {clean_pin} in {info['city']} is fully serviceable via {info['partner']}. Delivery takes {info['eta']} and Cash on Delivery is available."
        }
    
    # If 6-digit valid Indian pincode format but not in sample directory, fallback gracefully
    if len(clean_pin) == 6 and clean_pin.isdigit():
        return {
            "serviceable": True,
            "pincode": clean_pin,
            "delivery_eta": "3 to 5 business days",
            "courier_partner": "Delhivery Express",
            "cod_available": True,
            "message": f"Yes, we provide pan-India delivery to pincode {clean_pin} via Delhivery Express. Delivery takes 3 to 5 business days, and Cash on Delivery is supported."
        }
        
    return {
        "serviceable": False,
        "error": "INVALID_PINCODE",
        "message": "Please provide a valid 6-digit Indian delivery pincode (such as 560001 or 110001) to check delivery timeline."
    }


def recommend_skincare_product(query: str) -> Dict[str, Any]:
    """
    Recommends matching skincare formulations based on skin type, concern, or product category.
    """
    from app.database import RECOMMENDATION_CATALOG
    
    q = query.lower()
    for key, data in RECOMMENDATION_CATALOG.items():
        if key in q:
            return {
                "match": True,
                "category": key,
                "recommended_product": data["product"],
                "reason": data["reason"],
                "message": f"For {key} skin, I highly recommend our {data['product']}. {data['reason']}"
            }
            
    # Default bestseller recommendation
    return {
        "match": True,
        "category": "bestseller",
        "recommended_product": "Vitamin C Radiance Serum 30ml",
        "reason": "Our top-rated organic serum for brightening, hydration, and daily glow.",
        "message": "Our most popular formulation is the Vitamin C Radiance Serum 30ml. It gives radiant hydration and is suitable for all skin types."
    }


def get_brand_information(brand_name: str = "") -> Dict[str, Any]:
    """
    Retrieves information on Aura's house of brands (Aura Skincare, Aura Derma, Aura Men).
    """
    from app.database import AURA_BRANDS
    
    b = brand_name.lower()
    if "derma" in b:
        data = AURA_BRANDS["Aura Derma"]
        return {
            "brand": "Aura Derma",
            "tagline": data["tagline"],
            "hero_products": data["hero_products"],
            "message": "Aura Derma is our clinical active line, featuring science-backed formulations like Niacinamide 10% and Salicylic Acid 2% for persistent blemishes."
        }
    elif "men" in b:
        data = AURA_BRANDS["Aura Men"]
        return {
            "brand": "Aura Men",
            "tagline": data["tagline"],
            "hero_products": data["hero_products"],
            "message": "Aura Men is our specialized men's grooming collection, featuring charcoal pollution defense cleansers and cedarwood beard growth oils."
        }
    else:
        return {
            "brands": list(AURA_BRANDS.keys()),
            "message": "Aura operates three specialized beauty lines: Aura Skincare for pure organic botanicals, Aura Derma for clinical actives, and Aura Men for men's grooming."
        }


# Available tool functions mapped by name for easy invocation
TOOL_REGISTRY = {
    "get_order_details": get_order_details,
    "cancel_order": cancel_order,
    "check_pincode_serviceability": check_pincode_serviceability,
    "recommend_skincare_product": recommend_skincare_product,
    "get_brand_information": get_brand_information
}


# Tool definitions formatted for Google GenAI / Gemini Function Calling
GEMINI_TOOL_DECLARATIONS = [
    {
        "name": "get_order_details",
        "description": "Retrieve live order details, tracking information, status, and item information using an order ID (e.g. ORD-101).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "order_id": {
                    "type": "STRING",
                    "description": "The unique Order ID to search for, e.g. 'ORD-101', 'ORD-102', 'ORD-103'."
                }
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "cancel_order",
        "description": "Request cancellation of an order. Only orders in 'Processing' status are eligible for cancellation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "order_id": {
                    "type": "STRING",
                    "description": "The unique Order ID to cancel, e.g. 'ORD-103'."
                }
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "check_pincode_serviceability",
        "description": "Check if an Indian delivery pincode is serviceable, courier partner, and estimated delivery days.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "pincode": {
                    "type": "STRING",
                    "description": "6-digit Indian postal code, e.g. '560001', '110001'."
                }
            },
            "required": ["pincode"]
        }
    },
    {
        "name": "recommend_skincare_product",
        "description": "Provide tailored organic skincare product recommendations based on skin type (dry, oily, sensitive) or concern (acne, pigmentation).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "The skin concern or type, e.g. 'dry skin', 'acne', 'pigmentation'."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_brand_information",
        "description": "Lookup information on Aura's multi-brand ecosystem (Aura Skincare, Aura Derma, Aura Men).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "brand_name": {
                    "type": "STRING",
                    "description": "Brand name to inquire about, e.g. 'Aura Derma', 'Aura Men'."
                }
            },
            "required": []
        }
    }
]
