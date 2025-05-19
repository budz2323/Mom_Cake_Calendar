from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    event = db.Column(db.String(100), nullable=False)
    theme = db.Column(db.String(100))
    date = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    delivery = db.Column(db.String(50))
    pickup_address = db.Column(db.String(200))
    delivery_address = db.Column(db.String(200))
