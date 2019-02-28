// BASE
const elements = {

    searchForm: document.querySelector('.search'),
    searchInput: document.querySelector('.search__field'),
    SearchRes: document.querySelector('.results'),
    searchResList: document.querySelector('.results__list')
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
    if (loader) loader.parentElement.removeChild(loader);
};

// SEARCH VIEW
const getInput = () => elements.searchInput.value; // resgata o valor do input

const clearInputs = () => elements.searchInput.value = ''; // limpa o input de pesquisa

const clearResults = () => elements.searchResList.innerHTML = ''; // limpa a lista de receitas

const limitRecipeTitle = (title, limit = 17) => { // Reduz o tamanho do título de acordo com o UI
    // example: Pasta With Tomato and Spinach -> split -> ['Pasta', 'With', 'Tomato', 'and', 'Spinach']
    /* 
        acc: 0 / acc + cur.length = 5 / newTitle = ['Pasta']
        acc: 5 / acc + cur.length = 9 / newTitle = ['Pasta', 'With']
        acc: 9 / acc + cur.length = 15 / newTitle = ['Pasta', 'With', 'Tomato']
        acc: 15 / acc + cur.length = 18 / newTitle = ['Pasta', 'With', 'Tomato'] - Não insere a próxima string na array
        acc: 18 / acc + cur.length = 24 / newTitle = ['Pasta', 'With', 'Tomato']
    */
    const newTitle = [];
    if (title.length > limit) {
        title.split(' ').reduce((acc, cur) => {
            // console.log(`Acumulador: ${acc} Elemento Atual: ${cur}`);
            if (acc + cur.length <= 17) {
                newTitle.push(cur);
            }
            return acc + cur.length;
        }, 0);
        // return the result
        return `${newTitle.join(' ')} ...`; // junta as strings de uma array acrescendo um espaço entre elas 
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

const renderResults = recipes => recipes.recipes.forEach(el => renderRecipe(el)); // rendereza o resultado de pesquisa a cada interação com a função

// SEARCH
class Search {
    
    constructor(query) {
        this.query = query;
    }
    
    async getResults () {
        
        // axios -> npm install axios -> import axios from axios; (Permite a visualização em qualquer browser)
        
        // const proxy = 'http://crossorigin.me/';
        // const proxy = 'https://cors-anywhere.herokuapp.com/';
        const key = 'abada4a41d09645f246271968ff65c37';
        
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

/* 
Global State of the app 
- Search Object
- Current recipe Object
- Shopping list object
- Liked Recipes
*/
const state = {};

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

        // 4) Search for recipes
        await state.search.getResults(); // retorna uma promise com a lista de receitas

        // 5) Render results on UI
        clearLoader();
        renderResults(state.search.result); // renderiza a lista de receitas no UI
    }
};

elements.searchForm.addEventListener('submit', e => { // Impede que um link abra o URL

    e.preventDefault();
    controlSearch();
});

































