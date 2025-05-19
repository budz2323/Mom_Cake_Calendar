document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    // Modals and form elements
    const orderModal = document.getElementById('orderModal');
    const eventDetailsModal = document.getElementById('eventDetailsModal');
    const eventDetailsContent = document.getElementById('eventDetailsContent');
    const closeOrderModalBtn = document.getElementById('closeModal');
    const closeDetailsModalBtn = document.getElementById('closeDetailsModal');
    const openBtn = document.getElementById('newOrderBtn');
    const form = document.getElementById('orderForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const pickupAddressField = document.getElementById('pickupAddress');
    const deliveryAddressField = document.getElementById('deliveryAddress');

    let editingOrderId = null; // Track current order being edited

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        events: '/events',
        eventClick: function(info) {
            const props = info.event.extendedProps;

            // Build read-only HTML for event details modal
            eventDetailsContent.innerHTML = `
                <p><strong>Order:</strong> ${info.event.title}</p>
                <p><strong>Type:</strong> ${props.eventType || 'N/A'}</p>
                <p><strong>Theme:</strong> ${props.theme || 'N/A'}</p>
                <p><strong>Date:</strong> ${info.event.startStr || 'N/A'}</p>
                <p><strong>Delivery:</strong> ${props.delivery || 'N/A'}</p>
                <p><strong>Description:</strong> ${props.description || 'N/A'}</p>
                <p><strong>Pickup Address:</strong> ${props.pickupAddress || 'N/A'}</p>
                <p><strong>Delivery Address:</strong> ${props.deliveryAddress || 'N/A'}</p>
                <button id="editOrderBtn">Edit Order</button>
            `;

            // Store id for editing later
            editingOrderId = info.event.id;

            // Show event details modal
            eventDetailsModal.style.display = 'block';

            // Setup Edit button listener
            document.getElementById('editOrderBtn').onclick = () => {
                // Close details modal
                eventDetailsModal.style.display = 'none';

                // Populate the form with existing data
                form.name.value = props.name || info.event.title.split(' - ')[0];
                form.event.value = props.eventType || '';
                form.theme.value = props.theme || '';
                form.date.value = info.event.startStr || '';
                form.delivery.value = props.delivery || '';
                form.description.value = props.description || '';
                form.pickupAddress.value = props.pickupAddress || '';
                form.deliveryAddress.value = props.deliveryAddress || '';

                // Show/hide pickup/delivery address fields
                if (props.delivery === 'Pickup') {
                    pickupAddressField.style.display = 'block';
                    deliveryAddressField.style.display = 'none';
                } else if (props.delivery === 'Delivery') {
                    deliveryAddressField.style.display = 'block';
                    pickupAddressField.style.display = 'none';
                } else {
                    pickupAddressField.style.display = 'none';
                    deliveryAddressField.style.display = 'none';
                }

                // Change submit button text
                submitBtn.textContent = 'Update Order';

                // Show the order modal (form)
                orderModal.style.display = 'block';
            };
        }
    });

    calendar.render();

    // Delivery option toggle logic inside the form
    const deliveryRadios = form.querySelectorAll('input[name="delivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Pickup') {
                pickupAddressField.style.display = 'block';
                deliveryAddressField.style.display = 'none';
            } else if (radio.value === 'Delivery') {
                deliveryAddressField.style.display = 'block';
                pickupAddressField.style.display = 'none';
            }
        });
    });

    // Open new order modal
    openBtn.onclick = () => {
        editingOrderId = null; // Reset editing ID
        submitBtn.textContent = 'Submit Order'; // Reset button text
        form.reset();
        pickupAddressField.style.display = 'none';
        deliveryAddressField.style.display = 'none';
        orderModal.style.display = 'block';
    };

    // Close modals handlers
    closeOrderModalBtn.onclick = () => {
        orderModal.style.display = 'none';
    };
    closeDetailsModalBtn.onclick = () => {
        eventDetailsModal.style.display = 'none';
    };
    window.onclick = (e) => {
        if (e.target === orderModal) orderModal.style.display = 'none';
        if (e.target === eventDetailsModal) eventDetailsModal.style.display = 'none';
    };

    // Load orders into sidebar list (optional)
    async function loadOrders() {
        try {
            const response = await fetch('/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            const orders = await response.json();
            const ordersList = document.getElementById('ordersList');
            ordersList.innerHTML = '';
            orders.forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.textContent = `${order.title} on ${order.start}`;
                ordersList.appendChild(orderItem);
            });
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }
    loadOrders();

    // Handle form submit: add or update order
    form.onsubmit = async function (e) {
        e.preventDefault();

        const order = {
            name: form.name.value,
            event: form.event.value,
            theme: form.theme.value,
            date: form.date.value,
            delivery: form.delivery.value,
            pickupAddress: form.pickupAddress.value,
            deliveryAddress: form.deliveryAddress.value,
            description: form.description.value
        };

        try {
            let response;
            if (editingOrderId) {
                // Update existing order
                response = await fetch(`/update_order/${editingOrderId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            } else {
                // Add new order
                response = await fetch('/add_order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            }

            if (!response.ok) throw new Error('Failed to save order');

            // Close modals and reset
            orderModal.style.display = 'none';
            form.reset();
            pickupAddressField.style.display = 'none';
            deliveryAddressField.style.display = 'none';
            submitBtn.textContent = 'Submit Order';
            editingOrderId = null;

            // Refresh calendar & list
            calendar.refetchEvents();
            loadOrders();

        } catch (error) {
            alert('Error saving order, please try again.');
            console.error('Submit error:', error);
        }
    };
});
