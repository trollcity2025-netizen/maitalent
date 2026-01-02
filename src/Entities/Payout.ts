export default {
  "name": "Payout",
  "type": "object",
  "properties": {
    "contestant_id": {
      "type": "string"
    },
    "contestant_email": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    },
    "position": {
      "type": "number",
      "enum": [
        1,
        2,
        3
      ]
    },
    "season": {
      "type": "string"
    },
    "payment_method": {
      "type": "string",
      "enum": [
        "paypal",
        "gift_card"
      ]
    },
    "paypal_email": {
      "type": "string"
    },
    "gift_card_type": {
      "type": "string",
      "enum": [
        "amazon",
        "visa",
        "mastercard"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "pending",
        "processing",
        "completed",
        "failed"
      ],
      "default": "pending"
    },
    "transaction_id": {
      "type": "string"
    },
    "completed_date": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "contestant_id",
    "amount",
    "position",
    "payment_method"
  ]
} as const;
