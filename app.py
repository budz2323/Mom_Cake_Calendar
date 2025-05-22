import os
from flask import Flask, render_template, request, jsonify
from models import db, Order

app = Flask(__name__)

# Get database URL from environment or fallback to local SQLite
database_url = os.environ.get('DATABASE_URL', 'sqlite:///orders.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables at startup
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/events')
def events():
    orders = Order.query.all()
    return jsonify([
        {
            "id": o.id,
            "title": f"{o.name} - {o.event}",
            "start": o.date,
            "extendedProps": {
                "eventType": o.event,
                "theme": o.theme,
                "delivery": o.delivery,
                "description": o.description,
                "pickupAddress": o.pickup_address,
                "deliveryAddress": o.delivery_address,
                "name": o.name
            }
        } for o in orders
    ])

@app.route('/add_order', methods=['POST'])
def add_order():
    data = request.json
    order = Order(
        name=data['name'],
        event=data['event'],
        theme=data['theme'],
        date=data['date'],
        description=data.get('description', ''),
        delivery=data['delivery'],
        pickup_address=data.get('pickupAddress'),
        delivery_address=data.get('deliveryAddress')
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({'success': True, 'id': order.id})

@app.route('/update_order/<int:order_id>', methods=['POST'])
def update_order(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json

    order.name = data['name']
    order.event = data['event']
    order.theme = data['theme']
    order.date = data['date']
    order.description = data.get('description', '')
    order.delivery = data['delivery']
    order.pickup_address = data.get('pickupAddress')
    order.delivery_address = data.get('deliveryAddress')

    db.session.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
