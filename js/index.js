// FRACTIONAL //
var Fraction = function(numerator, denominator) {
    /* double argument invocation */
    if (typeof numerator !== 'undefined' && denominator) {
        if (
			(typeof(  numerator) === 'number' ||   numerator instanceof Number)
		&&
			(typeof(denominator) === 'number' || denominator instanceof Number)
		){
            this.numerator = numerator;
            this.denominator = denominator;
        } else if (
			(typeof(  numerator) === 'string' ||   numerator instanceof String)
		&&
			(typeof(denominator) === 'string' || denominator instanceof String)
		) {
            // what are they?
            // hmm....
            // assume they are floats?
            this.numerator = parseFloat(numerator.replace(",","."));
            this.denominator = parseFloat(denominator.replace(",","."));
        }
        // TODO: should we handle cases when one argument is String and another is Number?
    /* single-argument invocation */
    } else if (typeof denominator === 'undefined') {
        var num = numerator; // swap variable names for legibility
		if (num instanceof Fraction) {
			this.numerator = num.numerator;
			this.denominator = num.denominator;
		} else if (typeof(num) === 'number' || num instanceof Number) {  // just a straight number init
            this.numerator = num;
            this.denominator = 1;
        } else if (typeof(num) === 'string' || num instanceof String) {
            var a, b;  // hold the first and second part of the fraction, e.g. a = '1' and b = '2/3' in 1 2/3
                       // or a = '2/3' and b = undefined if we are just passed a single-part number
            var arr = num.split(' ');
            if (arr[0]) a = arr[0];
            if (arr[1]) b = arr[1];
            /* compound fraction e.g. 'A B/C' */
            //  if a is an integer ...
            if (a % 1 === 0 && b && b.match('/')) {
                return (new Fraction(a)).add(new Fraction(b));
            } else if (a && !b) {
                /* simple fraction e.g. 'A/B' */
                if ((typeof(a) === 'string' || a instanceof String) && a.match('/')) {
                    // it's not a whole number... it's actually a fraction without a whole part written
                    var f = a.split('/');
                    this.numerator = f[0]; this.denominator = f[1];
                /* string floating point */
                } else if ((typeof(a) === 'string' || a instanceof String) && a.match('\.')) {
                    return new Fraction(parseFloat(a.replace(",",".")));
                /* whole number e.g. 'A' */
                } else { // just passed a whole number as a string
                    this.numerator = parseInt(a);
                    this.denominator = 1;
                }
            } else {
                return undefined; // could not parse
            }
        }
    }
    this.normalize();
}

Fraction.prototype.clone = function() {
    return new Fraction(this.numerator, this.denominator);
}

/* pretty-printer, converts fractions into whole numbers and fractions */
Fraction.prototype.toString = function() {
	if (isNaN(this.denominator))
//	if (this.denominator !== this.denominator) //They say it would be faster. (?)
		return 'NaN';
    var result = '';
    if ((this.numerator < 0) != (this.denominator < 0))
        result = '-';
    var numerator = Math.abs(this.numerator);
    var denominator = Math.abs(this.denominator);

    var wholepart = Math.floor(numerator / denominator);
    numerator = numerator % denominator;
    if (wholepart != 0)
        result += wholepart;
    if (numerator != 0)
    {
		if(wholepart != 0)
			result+=' ';
        result += numerator + '/' + denominator;
	}
    return result.length > 0 ? result : '0';
}

/* pretty-printer to support TeX notation (using with MathJax, KaTeX, etc) */
Fraction.prototype.toTeX = function(mixed) {
	if (isNaN(this.denominator))
		return 'NaN';
    var result = '';
    if ((this.numerator < 0) != (this.denominator < 0))
        result = '-';
    var numerator = Math.abs(this.numerator);
    var denominator = Math.abs(this.denominator);

    if(!mixed){
		//We want a simple fraction, without wholepart extracted
		if(denominator === 1)
			return result + numerator;
		else
			return result + '\\frac{' + numerator + '}{' + denominator + '}';
	}
    var wholepart = Math.floor(numerator / denominator);
    numerator = numerator % denominator;
    if (wholepart != 0)
        result += wholepart;
    if (numerator != 0)
        result += '\\frac{' + numerator + '}{' + denominator + '}';
    return result.length > 0 ? result : '0';
}

/* destructively rescale the fraction by some integral factor */
Fraction.prototype.rescale = function(factor) {
    this.numerator *= factor;
    this.denominator *= factor;
    return this;
}

Fraction.prototype.add = function(b) {
    var a = this.clone();
    if (b instanceof Fraction) {
        b = b.clone();
    } else {
        b = new Fraction(b);
    }
    var td = a.denominator;
    a.rescale(b.denominator);
    a.numerator += b.numerator * td;

    return a.normalize();
}

Fraction.prototype.subtract = function(b) {
    var a = this.clone();
    if (b instanceof Fraction) {
        b = b.clone();  // we scale our argument destructively, so clone
    } else {
        b = new Fraction(b);
    }
    var td = a.denominator;
    a.rescale(b.denominator);
    a.numerator -= b.numerator * td;

    return a.normalize();
}


Fraction.prototype.multiply = function(b) {
    var a = this.clone();
    if (b instanceof Fraction)
    {
        a.numerator *= b.numerator;
        a.denominator *= b.denominator;
    } else if (typeof b === 'number') {
        a.numerator *= b;
    } else {
        return a.multiply(new Fraction(b));
    }
    return a.normalize();
}

Fraction.prototype.divide = function(b) {
    var a = this.clone();
    if (b instanceof Fraction)
    {
        a.numerator *= b.denominator;
        a.denominator *= b.numerator;
    } else if (typeof b === 'number') {
        a.denominator *= b;
    } else {
        return a.divide(new Fraction(b));
    }
    return a.normalize();
}

Fraction.prototype.equals = function(b) {
    if (!(b instanceof Fraction)) {
        b = new Fraction(b);
    }
    // fractions that are equal should have equal normalized forms
    var a = this.clone().normalize();
    var b = b.clone().normalize();
    return (a.numerator === b.numerator && a.denominator === b.denominator);
}

/* Utility functions */

/* Destructively normalize the fraction to its smallest representation. 
 * e.g. 4/16 -> 1/4, 14/28 -> 1/2, etc.
 * This is called after all math ops.
 */
Fraction.prototype.normalize = (function() {

    var isFloat = function(n)
    {
        return (typeof(n) === 'number' &&
                ((n > 0 && n % 1 > 0 && n % 1 < 1) || 
                 (n < 0 && n % -1 < 0 && n % -1 > -1))
               );
    }

    var roundToPlaces = function(n, places) 
    {
        if (!places) {
            return Math.round(n);
        } else {
            var scalar = Math.pow(10, places);
            return Math.round(n*scalar)/scalar;
        }
    }
        
    return (function() {

        // XXX hackish.  Is there a better way to address this issue?
        //
        /* first check if we have decimals, and if we do eliminate them
         * multiply by the 10 ^ number of decimal places in the number
         * round the number to nine decimal places
         * to avoid js floating point funnies
         */
        if (isFloat(this.denominator)) {
            var rounded = roundToPlaces(this.denominator, 9);
            var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
            this.denominator = Math.round(this.denominator * scaleup); // this !!! should be a whole number
            //this.numerator *= scaleup;
            this.numerator *= scaleup;
        } 
        if (isFloat(this.numerator)) {
            var rounded = roundToPlaces(this.numerator, 9);
            var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
            this.numerator = Math.round(this.numerator * scaleup); // this !!! should be a whole number
            //this.numerator *= scaleup;
            this.denominator *= scaleup;
        }
        var gcf = Fraction.gcf(this.numerator, this.denominator);
        this.numerator /= gcf;
        this.denominator /= gcf;
        if (this.denominator < 0) {
            this.numerator *= -1;
            this.denominator *= -1;
        }
        return this;
    });

})();

/* Takes two numbers and returns their greatest common factor. */
//Adapted from Ratio.js
Fraction.gcf = function(a, b) {
    if (arguments.length < 2) {
        return a;
    }
    var c;
    a = Math.abs(a);
    b = Math.abs(b);
/*  //It seems to be no need in these checks
    // Same as isNaN() but faster
    if (a !== a || b !== b) {
        return NaN;
    }
    //Same as !isFinite() but faster
    if (a === Infinity || a === -Infinity || b === Infinity || b === -Infinity) {
        return Infinity;
     }
     // Checks if a or b are decimals
     if ((a % 1 !== 0) || (b % 1 !== 0)) {
         throw new Error("Can only operate on integers");
     }
*/

    while (b) {
        c = a % b;
        a = b;
        b = c;
    }
    return a;
};

//Not needed now
// Adapted from: 
// http://www.btinternet.com/~se16/js/factor.htm
Fraction.primeFactors = function(n) {

    var num = Math.abs(n);
    var factors = [];
    var _factor = 2;  // first potential prime factor

    while (_factor * _factor <= num)  // should we keep looking for factors?
    {      
      if (num % _factor === 0)  // this is a factor
        { 
            factors.push(_factor);  // so keep it
            num = num/_factor;  // and divide our search point by it
        }
        else
        {
            _factor++;  // and increment
        }
    }

    if (num != 1)                    // If there is anything left at the end...
    {                                // ...this must be the last prime factor
        factors.push(num);           //    so it too should be recorded
    }

    return factors;                  // Return the prime factors
}

Fraction.prototype.snap = function(max, threshold) {
    if (!threshold) threshold = .0001;
    if (!max) max = 100;

    var negative = (this.numerator < 0);
    var decimal = this.numerator / this.denominator;
    var fraction = Math.abs(decimal % 1);
    var remainder = negative ? Math.ceil(decimal) : Math.floor(decimal);

    for(var denominator = 1; denominator <= max; ++denominator) {
        for(var numerator = 0; numerator <= max; ++numerator) {
            var approximation = Math.abs(numerator/denominator);
            if (Math.abs(approximation - fraction) < threshold) {
                return new Fraction(remainder * denominator + numerator * (negative ? -1 : 1), denominator);
            }
        }
    }

    return new Fraction(this.numerator, this.denominator);
};

/* If not in browser */
if (typeof module !== "undefined")
    module.exports.Fraction = Fraction

// KEY and PROXYs
const key = 'abada4a41d09645f246271968ff65c37'; // martiins_94@hotmail.com
// const key = '45e775870cf44fe08c33a86689b1fbea'; // lucasmartiinslima@gmail.com
// const key = '90a8bd8d02da94168288289c5e5c0ed4'; // larissa.charlynni1@hotmail.com

// const proxy = 'http://crossorigin.me/';
// const proxy = 'https://cors-anywhere.herokuapp.com/';

// BASE
const elements = {

    searchForm: document.querySelector('.search'),
    searchInput: document.querySelector('.search__field'),
    SearchRes: document.querySelector('.results'),
    searchResList: document.querySelector('.results__list'),
    searchResPages: document.querySelector('.results__pages'),
    recipe: document.querySelector('.recipe'),
    shopping: document.querySelector('.shopping__list'),
    likesMenu: document.querySelector('.likes__field'),
    likesList: document.querySelector('.likes__list')
};

const elementStrings = {

    loader: 'loader',
};

const renderLoader = parent => {

    const loader = `
        <div class="${elementStrings.loader}">
            <svg>
                <use href="img/icons.svg#icon-cw"></use>
            </svg>
        </div>
    `;
    parent.insertAdjacentHTML('afterbegin', loader);
};

const clearLoader = () => {

    const loader = document.querySelector(`.${elementStrings.loader}`);
    if (loader) loader.parentElement.removeChild(loader); // Se existir o elemento o .removeChild remove o elemento
};

// SEARCH VIEW
const getInput = () => elements.searchInput.value; // retorna o valor do input

const clearInputs = () => elements.searchInput.value = ''; // retorna uma string vazia ao elemento

const clearResults = () => {
    elements.searchResList.innerHTML = ''; // retorna uma string vazia ao elemento de receitas
    elements.searchResPages.innerHTML = ''; // retorna uma string vazia ao elemento de paginação
}; 

const highlightSelected = id => {
    const resultsArr = Array.from(document.querySelectorAll('.results__link'));
    resultsArr.forEach(el => { // remove a classe assim que outro elemento é ativado
        el.classList.remove('results__link--active');
    });
    document.querySelector(`.results__link[href*="${id}"]`).classList.add('results__link--active'); // destaca o item selecionado de acordo com o id recebido
};

const limitRecipeTitle = (title, limit = 17) => { // Reduz o tamanho do título de acordo com o UI
    // example: Pasta With Tomato and Spinach -> split -> ['Pasta', 'With', 'Tomato', 'and', 'Spinach']
    /* 
        acc: 0 / acc + cur.length = 5 / newTitle = ['Pasta']
        acc: 5 / acc + cur.length = 9 / newTitle = ['Pasta', 'With']
        acc: 9 / acc + cur.length = 15 / newTitle = ['Pasta', 'With', 'Tomato']
        acc: 15 / acc + cur.length = 18 / newTitle = ['Pasta', 'With', 'Tomato'] - Não insere a próxima string na array
        acc: 18 / acc + cur.length = 24 / newTitle = ['Pasta', 'With', 'Tomato']
    */
    const newTitle = []; // cria uma nova array onde será armazenado o novo título
    if (title.length > limit) {
        title.split(' ').reduce((acc, cur) => {
            // console.log(`Acumulador: ${acc} Elemento Atual: ${cur}`);
            if (acc + cur.length <= limit) {
                newTitle.push(cur);
            }
            return acc + cur.length;
        }, 0); // 0 -> Informa o ponto de partida do reduce
        return `${newTitle.join(' ')} ...`; // junta as strings de uma array acrescentando um espaço entre os elementos 
    };
    return title;
};

const renderRecipe = recipe => { // add uma lista como resultado de pesquisa pela receita, sendo este uma marcação html no DOM

    const markup = `
            <li>
            <a class="results__link" href="#${recipe.recipe_id}">
                <figure class="results__fig">
                    <img src="${recipe.image_url}" alt="${recipe.title}">
                </figure>
                <div class="results__data">
                    <h4 class="results__name">${limitRecipeTitle(recipe.title)}</h4>
                    <p class="results__author">${recipe.publisher}</p>
                </div>
            </a>
        </li>
    `; // gera a variável contento a marcação desejada

    elements.searchResList.insertAdjacentHTML('beforeend', markup); // Adiciona o elemento de de marcação no UI
};

// type: 'prev' or 'next'
// Os atributos globais data- * formam uma classe de atributos chamados atributos de dados personalizados , que permitem que informações proprietárias sejam trocadas entre o HTML e sua representação DOM por scripts.
const createButton = (page, type) => `
    <button class="btn-inline results__btn--${type}" data-goto=${type === 'prev' ? page - 1 : page + 1}>
        <span>Page ${type === 'prev' ? page - 1 : page + 1}</span>
        <svg class="search__icon">
            <use href="img/icons.svg#icon-triangle-${type === 'prev' ? 'left' : 'right'}"></use>
        </svg>
    </button>
`;

const renderButtons = (page, numResults, resPerPage) => {
    const pages = Math.ceil(numResults / resPerPage);

    let button; // usa-se let devido a alternância dos botões de acordo com a página
    if (page === 1 && pages > 1) {
        // Only button to go to next page
        button = createButton(page, 'next');
    } else if (page < pages) {
        // Both buttons
        button = `
            ${createButton(page, 'prev')}
            ${createButton(page, 'next')}
        `;
    } else if (page === pages && pages > 1) {
        // Only button to go to prev page
        button = createButton(page, 'prev');
    }

    elements.searchResPages.insertAdjacentHTML('afterbegin', button);
};

const renderResults = (recipes, page = 1, resPerPage = 10) => { 
    // render results of current page
    const start = (page - 1) * resPerPage;
    // 1pg - (1 - 1) * 10 = 0   - Começa na página 0    | end - 1 * 10 = 10
    // 2pg - (2 - 1) * 10 = 10  - Começa na página 10   | end - 2 * 10 = 20
    // 3pg - (3 - 1) * 10 = 20  - Começa na página 20   | end - 3 * 10 = 30
    // 4pg - (4 - 1) * 10 = 30  - Começa na página 30   | end - 4 * 10 = 40
    const end = page * resPerPage;

    recipes.recipes.slice(start, end).forEach(el => renderRecipe(el)); // rendereza o resultado de pesquisa a cada interação com a função

    // render the paginations buttons
    renderButtons(page, recipes.recipes.length, resPerPage);
};

// LIST VIEW
const renderItem = item => {

    const markup = `
        <li class="shopping__item" data-itemid=${item.id}>
            <div class="shopping__count">
                <input type="number" value="${item.count}" step="${item.count}" class="shopping__count-value">
                <p>${item.unit}</p>
            </div>
            <p class="shopping__description">${item.ingredient}</p>
            <button class="shopping__delete btn-tiny">
                <svg>
                    <use href="img/icons.svg#icon-circle-with-cross"></use>
                </svg>
            </button>
        </li>
    `;
    elements.shopping.insertAdjacentHTML('beforeend', markup);
};

deleteItem = id => {

    const item = document.querySelector(`[data-itemid="${id}"]  `);
    if (item) item.parentElement.removeChild(item);
};

// LIKES VIEW
const toggleLikeBtn = isLiked => {
    const iconString = isLiked ? 'icon-heart' : 'icon-heart-outlined';
    document.querySelector('.recipe__love use').setAttribute('href', `img/icons.svg#${iconString}`);
    // icons.svg#icon-heart-outlined
};

const toggleLikeMenu = numLikes => {
    elements.likesMenu.style.visibility = numLikes > 0 ? 'visible' : 'hidden';
};

const renderLike = like => {
    const markup = `
        <li>
            <a class="likes__link" href="#${like.id}">
                <figure class="likes__fig">
                    <img src="${like.img}" alt="${like.title}">
                </figure>
                <div class="likes__data">
                    <h4 class="likes__name">${limitRecipeTitle(like.title)}</h4>
                    <p class="likes__author">${like.author}</p>
                </div>
            </a>
        </li>
    `;
    elements.likesList.insertAdjacentHTML('beforeend', markup);
};

const deleteLike = id => {
    const el = document.querySelector(`.likes__link[href*="${id}"]`).parentElement;
    if (el) el.parentElement.removeChild(el);
}

// RECIPE VIEW
const clearRecipe = () => { elements.recipe.innerHTML = '' };

const formatCount = count => {

    if (count) {
        // count = 2.5 --> 5/2 --> 2 1/2
        // count = 0.5 --> 1/2
        const newCount = Math.round(count * 10000) / 10000;
        const [int, dec] = newCount.toString().split('.').map(el => parseInt(el, 10));

        if (!dec) return newCount;

        if (int === 0) {
            const fr = new Fraction(newCount);
            return `${fr.numerator}/${fr.denominator}`;
        } else {
            const fr = new Fraction(newCount - int);
            return `${int} ${fr.numerator}/${fr.denominator}`;
        }
    }
    return '?';
};

const createIngredient = ingredient => `
    <li class="recipe__item">
        <svg class="recipe__icon">
            <use href="img/icons.svg#icon-check"></use>
        </svg>
        <div class="recipe__count">${formatCount(ingredient.count)}</div>
        <div class="recipe__ingredient">
            <span class="recipe__unit">${ingredient.unit}</span>
            ${ingredient.ingredient}
        </div>
    </li>
`;

const renderRecipe2 = (recipe, isLiked) => {

    const markup = `
        <figure class="recipe__fig">
            <img src="${recipe.img}" alt="${recipe.title}" class="recipe__img">
            <h1 class="recipe__title">
                <span>${recipe.title}</span>
            </h1>
        </figure>

        <div class="recipe__details">
            <div class="recipe__info">
                <svg class="recipe__info-icon">
                    <use href="img/icons.svg#icon-stopwatch"></use>
                </svg>
                <span class="recipe__info-data recipe__info-data--minutes">${recipe.time}</span>
                <span class="recipe__info-text"> minutes</span>
            </div>
            <div class="recipe__info">
                <svg class="recipe__info-icon">
                    <use href="img/icons.svg#icon-man"></use>
                </svg>
                <span class="recipe__info-data recipe__info-data--people">${recipe.servings}</span>
                <span class="recipe__info-text"> servings</span>

                <div class="recipe__info-buttons">

                    <button class="btn-tiny btn-decrease">
                        <svg>
                            <use href="img/icons.svg#icon-circle-with-minus"></use>
                        </svg>
                    </button>

                    <button class="btn-tiny btn-increase">
                        <svg>
                            <use href="img/icons.svg#icon-circle-with-plus"></use>
                        </svg>
                    </button>

                </div>

            </div>
            <button class="recipe__love">
                <svg class="header__likes">
                    <use href="img/icons.svg#icon-heart${isLiked ? '' : '-outlined'}"></use>
                </svg>
            </button>
        </div>

        <div class="recipe__ingredients">
            <ul class="recipe__ingredient-list">
                ${recipe.ingredients.map(el => createIngredient(el)).join('')}
            </ul>

            <button class="btn-small recipe__btn recipe__btn--add">
                <svg class="search__icon">
                    <use href="img/icons.svg#icon-shopping-cart"></use>
                </svg>
                <span>Add to shopping list</span>
            </button>
        </div>

        <div class="recipe__directions">
            <h2 class="heading-2">How to cook it</h2>
            <p class="recipe__directions-text">
                This recipe was carefully designed and tested by
                <span class="recipe__by">${recipe.author}</span>. Please check out directions at their website.
            </p>
            <a class="btn-small recipe__btn" href="${recipe.url}" target="_blank">
                <span>Directions</span>
                <svg class="search__icon">
                    <use href="img/icons.svg#icon-triangle-right"></use>
                </svg>

            </a>
        </div>
    `;
    elements.recipe.insertAdjacentHTML('afterbegin', markup);
};

const updateServingsIngredients = recipe => {
    // Update servings
    document.querySelector('.recipe__info-data--people').textContent = recipe.servings;

    // Update ingredeints
    const countElements = Array.from(document.querySelectorAll('.recipe__count'));
    countElements.forEach((el, i) => {
        el.textContent = formatCount(recipe.ingredients[i].count);
    });
};

// RECIPE
class Recipe {

    constructor(id) {
        this.id = id;
    }

    async getRecipe () {

        try {
            const res = await fetch(`https://www.food2fork.com/api/get?key=${key}&rId=${this.id}`);
            const data = await res.json();
            this.title = data.recipe.title;
            this.author = data.recipe.publisher;
            this.img = data.recipe.image_url;
            this.url = data.recipe.source_url;
            this.ingredients = data.recipe.ingredients;
        } catch (error) {
            console.log(error);
            alert('Something went wrong :(')
        }
    }

    calcTime() {
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        
        // Para cada 3 ingreientes, considera-se 15 minutos
        this.time = periods * 15;
    }

    calcServings() {
        // 4 porções em cada uma das receitas
        this.servings = 4;
    }

    parseIngredients() {
        //                     0                1               2           3           4               5               6           7
        const unitsLong     = ['tablespoons',   'tablespoon',   'ounces',   'ounce',    'teaspoons',    'teaspoon',     'cups',     'pounds'];
        const unitsShort    = ['tbsp',          'tbsp',         'oz',       'oz',       'tsp',          'tsp',          'cup',      'pound']; // abreviação
        const units         = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            // 1) Uniform units
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            // 2) Remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' '); // Expressão regular para remover os parênteses!

            // 3) Parse ingredients into count, unit and ingredient
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;
            if (unitIndex > -1) {
                // There is a unit
                // Ex. 4 1/2 cups, arrCounts is [4, 1/2] --> eval("4+1/2") ---> 4.5
                // Ex. 4 cups, arrCounts is [4]
                const arrCount = arrIng.slice(0, unitIndex);
                
                let count;
                if (arrCount.length === 1) {
                    count = eval(arrIng[0].replace('-', '+'));
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                };

            } else if (parseInt(arrIng[0], 10)) {
                // There is NO unit, but 1st element is number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ')
                }
            } else if (unitIndex === -1) {
                // There is NO unit and NO number in 1st position
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient,
                }
            }

            return objIng;
        });
        this.ingredients = newIngredients;
    };

    updateServings (type) { // Atualiza as porções e ambos os ingredientes
        // Servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

        // Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    };
};

// SEARCH
class Search {
    
    constructor(query) {
        this.query = query;
    }
    
    async getResults () {
        
        // axios -> npm install axios -> import axios from axios; (Permite a visualização em qualquer browser)

        try {
            const res = await fetch(`https://www.food2fork.com/api/search?key=${key}&q=${this.query}`);
            const data = await res.json(); // converte para json e retorna um objeto de arrays
            this.result = data;
            // console.log(result);
        } catch(error) {
            alert(`Ops! ${error}`);
        }
    }
};

// LIKES
class Likes {
    
    constructor() {
        this.likes = [];
    }

    addLike(id, title, author, img) {
        const like = { id, title, author, img };
        this.likes.push(like);
        
        // Persist data in localStorage
        this.persistData();
        
        return like;
    }
    
    deleteLike(id) {
        const index = this.likes.findIndex(el => el.id === id);
        this.likes.splice(index, 1);
        
        // Persist data in localStorage
        this.persistData();
    }
    
    isLiked(id) {
        return this.likes.findIndex(el => el.id === id) !== -1;
        
    }

    getNumLikes() {
        return this.likes.length;
    }

    persistData() {
        //                    ID      valor que poderá ser somente uma string
        localStorage.setItem('likes', JSON.stringify(this.likes)) // transforma em uma String
    }

    readStorage() {
        // Como o retorno do localStorage retorna uma string, precisamos convertê-lo novamente para JS
        // Quanto não existir a chave que estamos procurando, retorna-se null
        const storage = JSON.parse(localStorage.getItem('likes'));
        
        // Restaura os likes do armazenamento local
        if (storage) this.likes = storage;
    }
}

// UNIQ ID GENERATOR
uniqid = () => { // gera um conjunto de caracteres alfanuméricos aleatórios
    let ts=String(new Date().getTime()), i = 0, out = '';
    for(i=0;i<ts.length;i+=2) {        
        out+=Number(ts.substr(i, 2)).toString(36);    
    }
    return ('d'+out);
};

// LIST
class List {

    constructor() {
        this.items = [];
    }

    addItem (count, unit, ingredient) {
        const item = {
            id: uniqid(),
            count,
            unit,
            ingredient
        }
        this.items.push(item);
        return item
    }

    deleteItem (id) {
        const index = this.items.findIndex(el => el.id === id);
        // [2,4,8] splice(1,1) -> returns 4, original array is [2,8]
        // [2,4,8] slice(1,1) -> returns 4, original array is [2,4,8] - Não altera a Array original
        this.items.splice(index, 1);
    }

    updateCount(id, newCount) {
        this.items.find(el => el.id === id).count = newCount;
    }
};

/* 
Global State of the app 
- Search Object
- Current recipe Object
- Shopping list objecty
- Liked Recipes
*/
const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async() => { // Controle de Pesquisa

    // 1) Get the query from the view
    const query = getInput();

    // 2) New search object and add to state
    if (query) {
        state.search = new Search(query); // criando um elemento para o objeto state

        // 3) Prepare UI for results
        clearInputs(); // limpa o input de pesquisa
        clearResults(); // limpa a lista de resultados 
        renderLoader(elements.SearchRes); // Processa o loader

        try {
            // 4) Search for recipes
            await state.search.getResults(); // retorna uma promise com a lista de receitas
    
            // 5) Render results on UI
            clearLoader();
            renderResults(state.search.result); // renderiza a lista de receitas no UI
        } catch (error) { 
            alert('Something wrong with the search...');
        }
    }
};

elements.searchForm.addEventListener('submit', e => { // Impede que um link abra o URL
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', event => {
    // O método Element.closest() retorna o ancestral mais próximo, em relação ao elemento atual, que possui o seletor fornecido como parâmetro. No caso de o elemento atual possuir o seletor, o mesmo é retornado.  Caso não exista um ancestral o método retorna null.
    const btn = event.target.closest('.btn-inline'); // resgata o valor da tag criada pelo data do elemento button
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10); // base 10
        clearResults();
        renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */
controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', ''); // Retorna URL inteira ou (.hash), que retornará somente a hash
                                                      // Replace substitui a # por uma string vazia -> ''
    if (id) {
        // Prepare UI for changes
        clearRecipe();
        renderLoader(elements.recipe);

        //Highligh Selected search item
        if (state.search) highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);
        
        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            
            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            // console.log(state.recipe); // teste
            renderRecipe2(
                state.recipe,
                state.likes.isLiked(id)
            );
        } catch (error) {
            alert('Error processing recipe!');
        }
    }
};

// window.addEventListener('hashchange', controlRecipe); // retorna a hash pra cada alteração de chamada
// window.addEventListener('load', controlRecipe);

// Adicionando o mesmo eventListener para diferentes eventos.
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe)); // HABILITAR DEPOIS

/**
 * LIST CONTROLLER
 */
const controlList = () => {

    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        renderItem(item);
    })
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {

    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) { // exclui as compras ou qualquer elemento filho dele 
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        deleteItem(id);

    // handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const newValue = parseFloat(e.target.value, 10); // regata o valor atual do item clicado
        state.list.updateCount(id, newValue);
    };
});

/**
 * LIKE CONTROLLER
 */
const controlLike = () => {

    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        toggleLikeBtn(true);
        
        // Add like to UI list
        renderLike(newLike);
        
        // User HAS yet liked current recipe    
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);
        
        // Toggle the like button
        toggleLikeBtn(false);
        
        // Remove like from UI list
        deleteLike(currentID);
    };
    toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {

    state.likes = new Likes(); // cria uma instância vazia de Likes
    state.likes.readStorage(); // retorna os likes
    toggleLikeMenu(state.likes.getNumLikes()); // alterna/atualiza o like na UI
    state.likes.likes.forEach(like => renderLike(like)); // Renderiza os likes existentes
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {

    // O método Element.matches() retorna verdadeiro se o elemento puder ser selecionado pela sequência de caracteres específica; caso contrário retorna falso.
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        updateServingsIngredients(state.recipe)
        //                      Seletor de CSS para todos os elementos filhos do elemento .recipe__btn
    } else if (e.target.matches('.recipe__btn--add, recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, recipe__love *')) {
        // Like Controller
        controlLike();
    };
});
































