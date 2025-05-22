from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    event = db.Column(db.String(100))
    theme = db.Column(db.String(100))
    datetime = db.Column(db.String, nullable=False)  # combined datetime ISO string
    description = db.Column(db.Text)
    delivery = db.Column(db.String(50))
    pickup_address = db.Column(db.String(200))
    delivery_address = db.Column(db.String(200))

    def __repr__(self):
        return f'<Order {self.name} - {self.event}>'
