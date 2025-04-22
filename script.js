// Global variables
let expenses = [];
let selectedCategory = 'food';
let previousMonthsData = {};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Event listeners
    document.getElementById('expense-amount').addEventListener('input', formatCurrency);
    document.getElementById('add-expense-btn').addEventListener('click', addExpense);
    document.getElementById('close-modal').addEventListener('click', closeMonthDetailsModal);
    
    // Category selection
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => selectCategory(item));
    });
    
    // Slider navigation
    document.querySelector('.slider-nav.prev').addEventListener('click', () => slideCategories('prev'));
    document.querySelector('.slider-nav.next').addEventListener('click', () => slideCategories('next'));
});

// Initialize the application
function initApp() {
    // Set current date
    setCurrentDate();
    
    // Load data from cookies
    loadData();
    
    // Display daily expenses
    displayDailyExpenses();
    
    // Display total for current month
    updateMonthlyTotal();
    
    // Display previous months
    displayPreviousMonths();
    
    // Set the default category
    selectedCategory = 'food';
}

// Set current date in the date picker
function setCurrentDate() {
    const today = new Date();
    const dateField = document.getElementById('expense-date');
    
    // Format today's date to YYYY-MM-DD for the input field
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateField.value = `${year}-${month}-${day}`;
    
    // Update month display
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('current-month-display').textContent = 
        `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
}

// Format currency as the user types
function formatCurrency(e) {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value === '') {
        e.target.value = '';
        return;
    }
    
    // Format with thousand separators
    e.target.value = new Intl.NumberFormat('id-ID').format(value);
}

// Parse currency string to number
function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, '')) || 0;
}

// Format number to currency string
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Select a category
function selectCategory(item) {
    // Remove selected class from all items
    document.querySelectorAll('.category-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selected class to clicked item
    item.classList.add('selected');
    
    // Update selected category
    selectedCategory = item.dataset.category;
    
    // Show description field for 'other' category
    const descriptionContainer = document.getElementById('other-description-container');
    if (selectedCategory === 'other') {
        descriptionContainer.style.display = 'block';
    } else {
        descriptionContainer.style.display = 'none';
    }
}

// Slide categories horizontally
function slideCategories(direction) {
    const wrapper = document.querySelector('.slider-wrapper');
    const categoryWidth = 115; // Width of each category item + gap
    const visibleItems = Math.floor(wrapper.offsetWidth / categoryWidth);
    
    let currentPosition = parseInt(wrapper.style.transform.replace('translateX(', '').replace('px)', '') || 0);
    
    if (direction === 'prev') {
        // Slide right (show previous items)
        currentPosition = Math.min(0, currentPosition + categoryWidth);
    } else {
        // Slide left (show next items)
        const maxScroll = -(wrapper.scrollWidth - wrapper.offsetWidth);
        currentPosition = Math.max(maxScroll, currentPosition - categoryWidth);
    }
    
    wrapper.style.transform = `translateX(${currentPosition}px)`;
}

// Add a new expense
function addExpense() {
    const dateField = document.getElementById('expense-date');
    const amountField = document.getElementById('expense-amount');
    const descriptionField = document.getElementById('expense-description');
    
    // Validate input
    const amount = parseCurrency(amountField.value);
    if (amount <= 0) {
        showToast('Masukkan jumlah pengeluaran yang valid', 'error');
        return;
    }
    
    // Get date
    const expenseDate = new Date(dateField.value);
    if (isNaN(expenseDate.getTime())) {
        showToast('Pilih tanggal yang valid', 'error');
        return;
    }
    
    // Get description for 'other' category
    let description = '';
    if (selectedCategory === 'other') {
        description = descriptionField.value.trim();
        if (!description) {
            showToast('Masukkan keterangan untuk pengeluaran lainnya', 'error');
            return;
        }
    }
    
    // Create expense object
    const expense = {
        id: Date.now(),
        date: expenseDate,
        amount: amount,
        category: selectedCategory,
        description: description
    };
    
    // Add to expenses array
    expenses.push(expense);
    
    // Save data
    saveData();
    
    // Update UI
    displayDailyExpenses();
    updateMonthlyTotal();
    displayPreviousMonths();
    
    // Reset form
    amountField.value = '';
    if (selectedCategory === 'other') {
        descriptionField.value = '';
    }
    
    // Show success message
    showToast('Pengeluaran berhasil ditambahkan!', 'success');
}

// Display daily expenses
function displayDailyExpenses() {
    const container = document.getElementById('daily-expenses-container');
    container.innerHTML = '';
    
    // Get today's date (reset time to compare dates correctly)
    const today = new Date();
    const selectedDate = new Date(document.getElementById('expense-date').value);
    
    // Reset hours to ensure proper comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Check if selected date is today
    const isToday = selectedDate.getTime() === today.getTime();
    
    // Use selected date for filtering, not just today
    const selectedDateExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);
        return expDate.getTime() === selectedDate.getTime();
    });
    
    // Update title based on selected date
    const sectionTitle = document.querySelector('.daily-expenses h2');
    if (isToday) {
        sectionTitle.textContent = 'Pengeluaran Hari Ini';
    } else {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        sectionTitle.textContent = `Pengeluaran ${selectedDate.toLocaleDateString('id-ID', options)}`;
    }
    
    if (selectedDateExpenses.length === 0) {
        // Show empty state with appropriate message
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Belum ada pengeluaran tercatat untuk ${isToday ? 'hari ini' : 'tanggal ini'}</p>
            </div>
        `;
        return;
    }
    
    // Display expenses for selected date
    selectedDateExpenses.forEach(exp => {
        const expenseElement = createExpenseElement(exp);
        container.appendChild(expenseElement);
    });
}

// Add event listener for date change
document.addEventListener('DOMContentLoaded', function() {
    // Add existing event listeners...
    
    // Add date change event listener
    document.getElementById('expense-date').addEventListener('change', function() {
        displayDailyExpenses();
    });
});

// Create an expense element
function createExpenseElement(expense) {
    const expenseDiv = document.createElement('div');
    expenseDiv.className = 'expense-item';
    expenseDiv.dataset.id = expense.id;
    
    const categoryIcons = {
        food: 'fas fa-utensils',
        transport: 'fas fa-car',
        education: 'fas fa-graduation-cap',
        social: 'fas fa-coffee',
        subscription: 'fas fa-play-circle',
        health: 'fas fa-heartbeat',
        snacks: 'fas fa-cookie-bite',
        other: 'fas fa-ellipsis-h'
    };
    
    const categoryNames = {
        food: 'Makanan & Minuman',
        transport: 'Kendaraan',
        education: 'Perkuliahan',
        social: 'Nongkrong',
        subscription: 'Langganan',
        health: 'Kesehatan',
        snacks: 'Jajan',
        other: 'Lainnya'
    };
    
    const date = new Date(expense.date);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    
    let detailText = dateStr;
    if (expense.category === 'other' && expense.description) {
        detailText += ` - ${expense.description}`;
    }
    
    expenseDiv.innerHTML = `
        <div class="expense-info">
            <div class="expense-category">
                <i class="${categoryIcons[expense.category]}"></i>
                <span>${categoryNames[expense.category]}</span>
            </div>
            <div class="expense-details">${detailText}</div>
        </div>
        <div class="expense-amount">Rp ${formatNumber(expense.amount)}</div>
        <div class="expense-actions">
            <button class="delete-expense" onclick="deleteExpense(${expense.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    return expenseDiv;
}

// Delete an expense
function deleteExpense(id) {
    // Find the expense index
    const index = expenses.findIndex(exp => exp.id === id);
    if (index === -1) return;
    
    // Remove the expense
    expenses.splice(index, 1);
    
    // Save data
    saveData();
    
    // Update UI
    displayDailyExpenses();
    updateMonthlyTotal();
    displayPreviousMonths();
    
    // Show success message
    showToast('Pengeluaran berhasil dihapus', 'info');
}

// Update monthly total
function updateMonthlyTotal() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate total for current month
    const monthlyTotal = expenses.reduce((total, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            return total + exp.amount;
        }
        return total;
    }, 0);
    
    // Update the UI
    document.getElementById('current-month-total').textContent = `Rp ${formatNumber(monthlyTotal)}`;
}

// Display previous months
function displayPreviousMonths() {
    const container = document.getElementById('previous-months-container');
    container.innerHTML = '';
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create an array of the last 3 months (excluding current)
    const months = [];
    for (let i = 1; i <= 3; i++) {
        let monthIndex = currentMonth - i;
        let year = currentYear;
        
        // Handle year change
        if (monthIndex < 0) {
            monthIndex += 12;
            year -= 1;
        }
        
        months.push({ month: monthIndex, year: year });
    }
    
    // Process and display each month
    months.forEach(({ month, year }) => {
        // Calculate total for this month
        const monthlyTotal = expenses.reduce((total, exp) => {
            const expDate = new Date(exp.date);
            if (expDate.getMonth() === month && expDate.getFullYear() === year) {
                return total + exp.amount;
            }
            return total;
        }, 0);
        
        // Store data for this month
        const monthKey = `${year}-${month}`;
        previousMonthsData[monthKey] = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === month && expDate.getFullYear() === year;
        });
        
        // Skip if no expenses for this month
        if (monthlyTotal === 0) return;
        
        // Month names
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        // Create month card
        const monthCard = document.createElement('div');
        monthCard.className = 'month-card';
        monthCard.dataset.month = monthKey;
        monthCard.innerHTML = `
            <h3>${monthNames[month]} ${year}</h3>
            <p>Rp ${formatNumber(monthlyTotal)}</p>
        `;
        
        // Add click event to show month details
        monthCard.addEventListener('click', () => showMonthDetails(monthKey));
        
        // Add to container
        container.appendChild(monthCard);
    });
    
    // Handle empty state
    if (container.children.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>Belum ada data pengeluaran untuk bulan-bulan sebelumnya</p>
            </div>
        `;
    }
}

// Show month details modal
function showMonthDetails(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    // Set modal title
    document.getElementById('modal-month-title').textContent = 
        `Pengeluaran ${monthNames[month]} ${year}`;
    
    // Get month expenses
    const monthExpenses = previousMonthsData[monthKey] || [];
    
    // Calculate total
    const monthTotal = monthExpenses.reduce((total, exp) => total + exp.amount, 0);
    document.getElementById('modal-month-total').textContent = `Rp ${formatNumber(monthTotal)}`;
    
    // Display expenses in modal
    const expenseList = document.getElementById('modal-expense-list');
    expenseList.innerHTML = '';
    
    if (monthExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Tidak ada data pengeluaran untuk bulan ini</p>
            </div>
        `;
    } else {
        // Group by date
        const expensesByDate = {};
        monthExpenses.forEach(exp => {
            const date = new Date(exp.date);
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            
            if (!expensesByDate[dateKey]) {
                expensesByDate[dateKey] = [];
            }
            
            expensesByDate[dateKey].push(exp);
        });
        
        // Sort by date (newest first)
        const sortedDates = Object.keys(expensesByDate).sort().reverse();
        
        // Display each date group
        sortedDates.forEach(dateKey => {
            const [year, month, day] = dateKey.split('-').map(Number);
            const dateStr = `${day}/${month}/${year}`;
            
            // Create date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `<h3>${dateStr}</h3>`;
            expenseList.appendChild(dateHeader);
            
            // Add expenses for this date
            expensesByDate[dateKey].forEach(exp => {
                const expenseElement = createExpenseElement(exp);
                expenseList.appendChild(expenseElement);
            });
        });
    }
    
    // Show modal
    const modal = document.getElementById('month-details-modal');
    modal.style.display = 'flex';
}

// Close month details modal
function closeMonthDetailsModal() {
    const modal = document.getElementById('month-details-modal');
    modal.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Save data to cookies
function saveData() {
    // Keep only the last 3 months of data
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    
    // Filter expenses
    expenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= threeMonthsAgo;
    });
    
    // Convert expenses array to JSON string
    const expensesJson = JSON.stringify(expenses);
    
    // Set cookie with expiration date (1 year)
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1);
    
    document.cookie = `expenses=${encodeURIComponent(expensesJson)}; expires=${expiration.toUTCString()}; path=/; SameSite=Strict`;
}

// Load data from cookies
function loadData() {
    const cookies = document.cookie.split(';');
    let expensesCookie = '';
    
    // Find expenses cookie
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('expenses=')) {
            expensesCookie = cookie.substring('expenses='.length);
            break;
        }
    }
    
    // Parse cookie if found
    if (expensesCookie) {
        try {
            const expensesData = JSON.parse(decodeURIComponent(expensesCookie));
            
            // Ensure dates are properly parsed back to Date objects
            expenses = expensesData.map(exp => ({
                ...exp,
                date: new Date(exp.date)
            }));
        } catch (e) {
            expenses = [];
            console.error('Error parsing expenses data:', e);
        }
    } else {
        expenses = [];
    }
}

// Clean up old data on a periodic basis
function cleanupOldData() {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    
    // Filter expenses
    const oldLength = expenses.length;
    expenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= threeMonthsAgo;
    });
    
    // If data was removed, save
    if (oldLength !== expenses.length) {
        saveData();
    }
}

// Periodically check and clean up old data (daily)
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

// Called when window is closed or refreshed
window.addEventListener('beforeunload', saveData);