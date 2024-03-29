// BUDGET CONTROLLER
const budgetController = (function () {

	const Expense = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function (totalIncome) {
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercentage = function () {
		return this.percentage;
	};

	const Income = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	const calculateTotal = function (type) {
		let sum = 0;

		data.allItems[type].forEach(function (el) {
			sum += el.value;
		});

		data.totals[type] = sum;
	};

	const data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1,
	};

	return {
		addItem: function (type, des, val) {
			let newItem, ID;

			// Create new ID
			if (data.allItems[type].length > 0) {
				ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
			} else {
				ID = 0;
			}

			// Create new item based on the type (inc or exp)
			if (type === 'exp') {

				newItem = new Expense(ID, des, val);
			} else if (type === 'inc') {
				newItem = new Income(ID, des, val);
			}

			// Push the item into our data structure
			data.allItems[type].push(newItem);

			// Return new item
			return newItem;
		},

		deleteItem: function (type, id) {
			let idsArr, index;

			idsArr = data.allItems[type].map(function (el) {
				return el.id;
			});

			index = idsArr.indexOf(id);

			if (index !== -1) {
				data.allItems[type].splice(index, 1);
			}

		},

		calculateBudget: function () {

			// Calculate total income and expenses
			calculateTotal('inc');
			calculateTotal('exp');

			// Calculate the budget based on totals (income - expenses)
			data.budget = data.totals.inc - data.totals.exp;

			// Calculate the percentage that we spent from our income
			if (data.totals.inc > 0) {
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			} else {
				data.percentage = -1;
			}
		},

		calculatePercentages: function () {
			data.allItems.exp.forEach(function (el) {
				el.calcPercentage(data.totals.inc);
			});
		},

		getPercentages: function () {
			const allPercentages = data.allItems.exp.map(function (el) {
				return el.getPercentage();
			});
			return allPercentages;
		},

		getBudget: function () {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage,
			};
		},

		testing: function () {
			console.log(data);
		},
	};

})();


// UI CONTROLLER
const UIController = (function () {

	const DOMstr = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expensesContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expensesLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercLabel: '.item__percentage',
		dateLabel: '.budget__title--month',
	};

	const formatNumber = function (nb, type) {
		let nbSplit, int, dec;

		// convert to absolute, then fix to 2 decimals
		nb = Math.abs(nb);
		nb = nb.toFixed(2);

		nbSplit = nb.split('.');

		// integer part
		int = nbSplit[0];
		if (int.length > 3) {
			int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
		}

		// decimal part
		dec = nbSplit[1];

		return (type === 'exp' ? '- ' : '+ ') + int + '.' + dec;
	};

	// IMPORTANT note: As of 2019, it is possible to use the forEach method directly on a nodeList
	const nodeListForEach = function (list, callback) {
		for (let i = 0; i < list.length; i++) {
			callback(list[i], i);
		}
	};

	return {
		getInput: function () {
			return {
				type: document.querySelector(DOMstr.inputType).value, // will be either inc or exp
				description: document.querySelector(DOMstr.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstr.inputValue).value), // parseFloat converts to number
			};
		},

		addListItem: function (obj, type) {
			let html, newHtml, element;

			// Create HTML str with placeholder text
			if (type === 'inc') {
				element = DOMstr.incomeContainer;
				html = `<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div>
			<div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete">
			<button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>`;
			} else if (type === 'exp') {
				element = DOMstr.expensesContainer;
				html = `<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div>
			<div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div>
			<div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
			</div></div></div>`;
			}

			// Replace the placeholder text with actual data
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%description%', obj.description);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

			// Insert the HTML into the DOM
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

		},

		deleteListItem: function (selectorID) {
			const el = document.getElementById(selectorID);

			el.parentNode.removeChild(el);
		},

		clearFields: function () {
			let fields, fieldsArr;

			fields = document.querySelectorAll(DOMstr.inputDescription + ', ' + DOMstr.inputValue);

			fieldsArr = Array.prototype.slice.call(fields);

			fieldsArr.forEach(function (el) {
				el.value = '';
			});

			fieldsArr[0].focus();

		},

		displayBudget: function (obj) {
			let budgetType;

			obj.budget > 0 ? budgetType = 'inc' : budgetType = 'exp';

			document.querySelector(DOMstr.budgetLabel).textContent = formatNumber(obj.budget, budgetType);
			document.querySelector(DOMstr.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
			document.querySelector(DOMstr.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

			// Make it so that if percentage is -1, display something else
			if (obj.percentage > 0) {
				document.querySelector(DOMstr.percentageLabel).textContent = obj.percentage + '%';
			} else {
				document.querySelector(DOMstr.percentageLabel).textContent = '--';
			}
		},

		displayPercentages: function (percentages) {
			const fields = document.querySelectorAll(DOMstr.expensesPercLabel);

			nodeListForEach(fields, function (el, i) {
				if (percentages[i] > 0) {
					el.textContent = percentages[i] + '%';
				} else {
					el.textContent = '--';
				}
			});
		},

		displayMonth: function () {
			let now, year, month;

			now = new Date;
			year = now.getFullYear();
			month = now.getMonth();

			months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

			document.querySelector(DOMstr.dateLabel).textContent = months[month] + ' ' + year;
		},

		changedType: function () {
			const fields = document.querySelectorAll(DOMstr.inputType + ',' + DOMstr.inputDescription + ',' + DOMstr.inputValue);

			nodeListForEach(fields, function (el) {
				el.classList.toggle('red-focus');
			});

			document.querySelector(DOMstr.inputBtn).classList.toggle('red');
		},

		getDOMstr: function () {
			return DOMstr;
		},
	};

})();


// GLOBAL APP CONTROLLER
const controller = (function (budgetCtrl, UICtrl) {

	const setupEventListeners = function () {
		const DOM = UICtrl.getDOMstr();

		// Add to item to list if btn is clicked or 'enter' is pressed
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
		document.addEventListener('keypress', function (event) {
			if (event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}
		});

		document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

	};

	const updateBudget = function () {

		// 1. Calculate the budget
		budgetCtrl.calculateBudget();

		// 2. Return the budget
		let budget = budgetCtrl.getBudget();

		// 3. Display the budget on the UI
		UICtrl.displayBudget(budget);
	};

	const updatePercentages = function () {

		// 1. Calculate the percentages
		budgetCtrl.calculatePercentages();

		// 2. Read percentage from the budget controller
		let percentages = budgetCtrl.getPercentages();

		// 3. Update the UI with new percentages
		UICtrl.displayPercentages(percentages);

	};

	const ctrlAddItem = function () {
		this.blur();
		let input, newItem;

		// 1. Get field input data
		input = UICtrl.getInput();

		// Add button only works if desc is not '' and input is not NaN or 0
		if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
			// 2. Add item to budget controller
			newItem = budgetCtrl.addItem(input.type, input.description, input.value);

			// 3. Add the item to the UI
			UICtrl.addListItem(newItem, input.type);

			// 4. Clear the fields (item description + value)
			UICtrl.clearFields();

			// 5. Calculate and update the budget
			updateBudget();

			// 6. Calculate and update percentages
			updatePercentages();

		}
	};

	const ctrlDeleteItem = function (event) {
		let itemID, splitID, type, ID;

		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

		if (itemID) {

			// inc-1
			splitID = itemID.split('-');
			type = splitID[0];
			ID = parseInt(splitID[1]);

			// 1. Delete the item from the data structure
			budgetCtrl.deleteItem(type, ID);

			// 2. Delete the item from the user interface
			UICtrl.deleteListItem(itemID);

			// 3. Update and show the new budget
			updateBudget();

			// 4. Calculate and update percentages
			updatePercentages();

		}

	};

	return {
		init: function () {
			console.log('Application has started');
			UICtrl.displayMonth();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1,
			});
			setupEventListeners();
		}
	};

})(budgetController, UIController);

controller.init();