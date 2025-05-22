import os
from flask import Flask, render_template, request, jsonify
from models import db, Order


app = Flask(__name__)

# Get database URL from environment or fallback to local SQLite
database_url = os.environ.get('DATABASE_URL', 'sqlite:///orders.db')

# Fix legacy Render issue: convert postgres:// → postgresql://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

###db_uri = os.getenv("DATABASE_URL", "sqlite:///local.db")

###app.config["SQLALCHEMY_DATABASE_URI"] = db_uri

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
            "start": o.datetime,
            "extendedProps": {
                "eventType": o.event,
                "theme": o.theme,
                "delivery": o.delivery,
                "description": o.description,
                "pickupAddress": o.pickup_address,
                "deliveryAddress": o.delivery_address,
                "name": o.name,
            }
        } for o in orders
    ])


@app.route('/add_order', methods=['POST'])
def add_order():
    data = request.get_json()
    order = Order(
        name=data.get('name'),
        event=data.get('event'),
        theme=data.get('theme'),
        datetime=data.get('datetime'),  # Combined ISO string
        description=data.get('description'),
        delivery=data.get('delivery'),
        pickup_address=data.get('pickupAddress'),
        delivery_address=data.get('deliveryAddress')
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({'success': True}), 201


@app.route('/update_order/<int:order_id>', methods=['POST'])
def update_order(order_id):
    data = request.get_json()
    order = Order.query.get_or_404(order_id)

    order.name = data.get('name', order.name)
    order.event = data.get('event', order.event)
    order.theme = data.get('theme', order.theme)
    order.datetime = data.get('datetime', order.datetime)
    order.description = data.get('description', order.description)
    order.delivery = data.get('delivery', order.delivery)
    order.pickup_address = data.get('pickupAddress', order.pickup_address)
    order.delivery_address = data.get('deliveryAddress', order.delivery_address)

    db.session.commit()
    return jsonify({'success': True})


@app.route('/delete_order/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted'}), 200

if __name__ == '__main__':
    app.run(debug=True)
