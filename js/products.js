/* ==========================================================
   NAMUNA SHOP — МАЪЛУМОТИ МАҲСУЛОТ
   Ин файл ягона ҷоест, ки маҳсулотро илова/таҳрир мекунед.
   Тавзеҳи пурра: README.md
   ========================================================== */

/* Рангҳо: номи ранг -> рамзи ранг (барои доираҳои ранг).
   Агар ранги нав илова кунед, ин ҷо як сатр илова кунед. */
const COLOR_HEX = {
  "Сиёҳ": "#141414",
  "Сафед": "#f4f4f0",
  "Сурх": "#c0202e",
  "Кабуд": "#1f4a8f",
  "Беж": "#d6c3a0",
  "Сабз": "#2f7a52"
};

/* Категорияҳо барои филтр ва саҳифаи асосӣ */
const CATEGORIES = ["Мардона", "Занона", "Аксессуарҳо"];

/* Шарҳҳои намунавӣ (нишондиҳии демо, на аз хидмати берунӣ) */
const DEMO_REVIEWS = [
  { name: "Фирӯза", rating: 5, text: "Сифат аъло аст, андоза дуруст омад. Тавсия медиҳам." },
  { name: "Рустам", rating: 5, text: "Мато хуб ва дӯхт тоза. Ба вақташ расонда шуд." },
  { name: "Мадина", rating: 4, text: "Ранг мисли акс аст. Нархаш ҳам муносиб." },
  { name: "Бахтиёр", rating: 5, text: "Бисёр қулай ва зебо. Бори дуюм ҳам мехарам." },
  { name: "Нигина", rating: 4, text: "Либос ба ман хеле мувофиқ омад, раҳмат." },
  { name: "Далер", rating: 5, text: "Аз сифат хурсандам, бо дӯстон ҳам маслиҳат додам." }
];

/* Рӯйхати маҳсулот. Ҳоло холӣ аст: маҳсулотро тавассути admin.html илова кунед. */
const PRODUCTS = [
  {
    "id": 1,
    "name": "футболкаи сафед",
    "category": "Мардона",
    "price": 100,
    "description": "Маҳсулоти босифат. Мулоим ва қулай барои ҳар рӯз.",
    "colors": [
      {
        "name": "Сафед",
        "images": [
          "assets/products/product-001/white/1.jpg"
        ]
      }
    ],
    "sizes": [
      "xxl"
    ],
    "soldOutSizes": [],
    "rating": 4.8,
    "reviews": 10,
    "featured": true,
    "newArrival": true,
    "sale": false,
    "hot": false,
    "limited": false
  },
  {
    "id": 2,
    "name": "фудболкаи сиёҳ",
    "category": "Мардона",
    "price": 56,
    "description": "Маҳсулоти босифат. Мулоим ва қулай барои ҳар рӯз.",
    "colors": [
      {
        "name": "Сиёҳ",
        "images": [
          "assets/products/product-002/black/1.jpg"
        ]
      }
    ],
    "sizes": [
      "xl"
    ],
    "soldOutSizes": [],
    "rating": 4.8,
    "reviews": 10,
    "featured": true,
    "newArrival": true,
    "sale": false,
    "hot": false,
    "limited": false
  },
  {
    "id": 3,
    "name": "Кофтаи капюшондор бо замок",
    "category": "Мардона",
    "price": 250,
    "oldPrice": 300,
    "description": "Маҳсулоти босифат. Мулоим ва қулай барои ҳар рӯз.",
    "colors": [
      {
        "name": "Кабуд",
        "images": [
          "assets/products/product-003/blue/1.jpg",
          "assets/products/product-003/blue/2.jpg",
          "assets/products/product-003/blue/3.jpg",
          "assets/products/product-003/blue/4.jpg"
        ]
      }
    ],
    "sizes": [
      "М"
    ],
    "soldOutSizes": [],
    "rating": 4.8,
    "reviews": 10,
    "featured": true,
    "newArrival": true,
    "sale": true,
    "hot": false,
    "limited": false
  },
  {
    "id": 4,
    "name": "костюм двойка",
    "category": "Мардона",
    "price": 500,
    "oldPrice": 550,
    "description": "Маҳсулоти босифат. Мулоим ва қулай барои ҳар рӯз.",
    "colors": [
      {
        "name": "Сиёҳ",
        "images": [
          "assets/products/product-004/black/1.jpg"
        ]
      },
      {
        "name": "Сурх",
        "images": [
          "assets/products/product-004/red/1.jpg"
        ]
      },
      {
        "name": "Кабуд",
        "images": [
          "assets/products/product-004/blue/1.jpg"
        ]
      }
    ],
    "sizes": [
      "ХL"
    ],
    "soldOutSizes": [],
    "rating": 4.8,
    "reviews": 10,
    "featured": true,
    "newArrival": true,
    "sale": true,
    "hot": false,
    "limited": false
  }
];
