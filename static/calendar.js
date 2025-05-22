document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
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
    const searchInput = document.getElementById('searchOrders');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const ordersList = document.getElementById('ordersList');
    const deliveryRadios = form.querySelectorAll('input[name="delivery"]');
    const orderTimeInput = form.querySelector('input[name="orderTime"]');

    let editingOrderId = null;
    let allOrders = [];

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        events: '/events',
        eventClick: function(info) {
            const props = info.event.extendedProps;

            // Store editing order id as integer
            editingOrderId = info.event.id;

            eventDetailsContent.innerHTML = `
                <p><strong>Order:</strong> ${info.event.title}</p>
                <p><strong>Type:</strong> ${props.eventType || 'N/A'}</p>
                <p><strong>Theme:</strong> ${props.theme || 'N/A'}</p>
                <p><strong>Date:</strong> ${info.event.startStr ? info.event.startStr.slice(0, 10) : 'N/A'}</p>
                <p><strong>Time:</strong> ${info.event.startStr ? info.event.startStr.slice(11, 16) : 'N/A'}</p>
                <p><strong>Delivery:</strong> ${props.delivery || 'N/A'}</p>
                <p><strong>Description:</strong> ${props.description || 'N/A'}</p>
                <p><strong>Pickup Address:</strong> ${props.pickupAddress || 'N/A'}</p>
                <p><strong>Delivery Address:</strong> ${props.deliveryAddress || 'N/A'}</p>
            `;

            eventDetailsModal.style.display = 'block';

            // Setup Edit button inside event details modal
            document.getElementById('editOrderBtn').onclick = () => {
                eventDetailsModal.style.display = 'none';

                // Populate form fields with event data
                form.name.value = props.name || info.event.title.split(' - ')[0] || '';
                form.event.value = props.eventType || '';
                form.theme.value = props.theme || '';
                form.date.value = info.event.startStr ? info.event.startStr.slice(0, 10) : '';
                orderTimeInput.value = info.event.startStr ? info.event.startStr.slice(11, 16) : '';
                form.description.value = props.description || '';
                form.pickupAddress.value = props.pickupAddress || '';
                form.deliveryAddress.value = props.deliveryAddress || '';

                // Set delivery radio checked
                deliveryRadios.forEach(radio => {
                    radio.checked = (radio.value === props.delivery);
                });

                // Show/hide address fields accordingly
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

                submitBtn.textContent = 'Update Order';
                orderModal.style.display = 'block';
            };
        }
    });

    calendar.render();

    // Open new order form
    openBtn.onclick = () => {
        editingOrderId = null;
        submitBtn.textContent = 'Submit Order';
        form.reset();
        pickupAddressField.style.display = 'none';
        deliveryAddressField.style.display = 'none';
        orderTimeInput.value = '';
        orderModal.style.display = 'block';
    };

    // Show/hide address fields on delivery option change
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Pickup') {
                pickupAddressField.style.display = 'block';
                deliveryAddressField.style.display = 'none';
            } else if (radio.value === 'Delivery') {
                deliveryAddressField.style.display = 'block';
                pickupAddressField.style.display = 'none';
            } else {
                pickupAddressField.style.display = 'none';
                deliveryAddressField.style.display = 'none';
            }
        });
    });

    // Close modals handlers
    closeOrderModalBtn.onclick = () => orderModal.style.display = 'none';
    closeDetailsModalBtn.onclick = () => eventDetailsModal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === orderModal) orderModal.style.display = 'none';
        if (e.target === eventDetailsModal) eventDetailsModal.style.display = 'none';
    };

    // Submit form for add or update
    form.onsubmit = async function (e) {
        console.log('Submitting order:', order);
        e.preventDefault();

        const date = form.date.value;
        const time = orderTimeInput.value;
        const datetimeISO = time ? `${date}T${time}:00` : date;

        // Get selected delivery value
        const deliveryValue = [...deliveryRadios].find(radio => radio.checked)?.value || '';

        const order = {
            name: form.name.value,
            event: form.event.value,
            theme: form.theme.value,
            datetime: datetimeISO,
            delivery: deliveryValue,
            pickupAddress: form.pickupAddress.value,
            deliveryAddress: form.deliveryAddress.value,
            description: form.description.value
        };

        try {
            let response;
            if (editingOrderId) {
                
                response = await fetch(`/update_order/${editingOrderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            } else {
                response = await fetch('/add_order', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            }

            if (!response.ok) throw new Error('Failed to save order');

            orderModal.style.display = 'none';
            form.reset();
            pickupAddressField.style.display = 'none';
            deliveryAddressField.style.display = 'none';
            orderTimeInput.value = '';
            submitBtn.textContent = 'Submit Order';
            editingOrderId = null;

            calendar.refetchEvents();
            loadOrders();
        } catch (error) {
            alert('Error saving order, please try again.');
            console.error('Submit error:', error);
        }
    };

    // Load all orders and render sidebar list
    async function loadOrders() {
        try {
            const response = await fetch('/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            allOrders = await response.json();
            filterAndRenderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    // Filter orders based on search input and render
    function filterAndRenderOrders() {
        const query = searchInput.value.toLowerCase();
        const filtered = allOrders.filter(order =>
            order.title.toLowerCase().includes(query)
        );
        renderOrders(filtered);
    }

    // Render orders in sidebar sorted by date/time ascending
    function renderOrders(orders) {
        orders.sort((a, b) => new Date(a.start) - new Date(b.start));
        ordersList.innerHTML = '';
        orders.forEach(order => {
            const dateTime = new Date(order.start);
            const item = createOrderItem(order.title, dateTime);
            item.style.cursor = 'pointer';
            item.onclick = () => {
                calendar.getEventById(order.id)?.click();
            };
            ordersList.appendChild(item);
        });
    }

    // Create order sidebar item element
    function createOrderItem(title, dateTime) {
        const item = document.createElement('div');
        item.className = 'order-item';
        item.textContent = `${title} — ${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        return item;
    }

    // Search input listener
    searchInput.addEventListener('input', filterAndRenderOrders);

    // Filter buttons change calendar view
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            calendar.changeView(view);
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Initial load of orders
    loadOrders();
});
