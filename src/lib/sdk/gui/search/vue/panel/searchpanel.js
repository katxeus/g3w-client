var inherit = require('core/utils/utils').inherit;
var localize = require('core/i18n/i18n.service').t;
var resolve = require('core/utils/utils').resolve;
var GUI = require('gui/gui');
var SearchQueryService = require('core/search/searchqueryservice');
var ListPanel = require('gui/listpanel').ListPanel;
var Panel = require('gui/panel');
var SearchResultPanelComponent = require('gui/search/vue/results/resultpanel');
var ProjectsRegistry = require('core/project/projectsregistry');

//componente vue pannello search
var SearchPanelComponet = Vue.extend({
  template: require('./searchpanel.html'),
  data: function() {
    return {
      forminputs: [],
      filterObject: {},
      formInputValues : []
    }
  },
  methods: {
    doSearch: function(event) {
      self = this;
      event.preventDefault();
      //al momento molto farragginoso ma da rivedere
      //per associazione valore input
      this.filterObject = fillFilterInputsWithValues(this.filterObject, this.formInputValues);
      SearchQueryService.doQuerySearch(this.filterObject);
    }
  }
});

//funzione che associa i valori dell'inputs form al relativo oggetto "operazionde del filtro"
//da migliorare perchè non mi piace e da considerare anche i casi più complessi come operazioni
//booleani all'interno

function fillFilterInputsWithValues (filterObject, formInputValues, globalIndex) {
  //funzione conversione da valore restituito dall'input (sempre stringa) al vero tipo di valore
  function convertInputValueToInputType(type, value) {
    switch(type) {
      case 'numberfield':
           value = parseInt(value);
           break;
      default:
           break;
    }
    return value;
  }
  //ciclo sull'oggetto filtro che ha come chiave root 'AND' o 'OR'
  _.forEach(filterObject.filterObject, function(v,k){
    //scorro attraverso l'array di elementi operazionali da confrontare
    _.forEach(v, function(input, idx){
      //elemento operazionale {'=':{}}
      _.forEach(input, function(v, k, obj){
        //vado a leggere l'oggetto attributo
        if (_.isArray(v)) {
          //richiama la funzione ricorsivamente .. andrà bene ?
          fillFilterInputsWithValues(input, formInputValues, idx);
        } else {
          _.forEach(v, function(v, k, obj){
            //considero l'index globale in modo che inputs di operazioni booleane interne
            //vengono considerate
            index = (globalIndex) ? globalIndex + idx : idx;
            obj[k] = convertInputValueToInputType(formInputValues[index].type, formInputValues[index].value);
          });
        };
      });
    });
  });
  return filterObject;
};

//costruttore del pannello e del suo componente vue
function SearchPanel() {
  self = this;
  this.config = {};
  this.filter = {};
  this.name = null;
  this.id = null;
  this.querytype = 'standard';
  this.querylayerid = null;
  this.InternalPanel = new SearchPanelComponet();
  //funzione inizializzazione
  this.init = function(config) {
      this.config = config || {};
      this.name = this.config.name || this.name;
      this.id = this.config.id || this.id;
      this.filter = this.config.options.filter || this.filter;
      this.querytype = this.config.options.querytype || this.querytype;
      this.querylayerid = this.config.options.querylayerid || this.querylayerid;
      this.url = this.config.options.queryurl || ProjectsRegistry.config.urls.ows;
      //vado a riempire gli input del form del pannello
      this.fillInputsFormFromFilter();
      //creo e assegno l'oggetto filtro
      var filterObjFromConfig = SearchQueryService.createQueryFilterFromConfig(this.filter);
      //alla fine creo l'ggetto finale del filtro da passare poi al queryWMSprovider
      this.InternalPanel.filterObject = SearchQueryService.createQueryFilterObject(this.querylayerid, filterObjFromConfig);
  };

  //funzione che popola gli inputs che ci saranno nel form del pannello ricerca
  //oltre costruire un oggetto che legherà i valori degli inputs del form con gli oggetti
  //'operazionali' del filtro
  this.fillInputsFormFromFilter = function() {
    var id = 0;
    var formValue;
    _.forEach(this.filter,function(v,k,obj) {
      _.forEach(v, function(input){
        //sempre nuovo oggetto
        formValue = {};
        //inserisco l'id all'input
        input.id = id
        //aggiungo il tipo al valore per fare conversione da stringa a tipo input
        formValue.type = input.input.type;
        ////TEMPORANEO !!! DEVO PRENDERE IL VERO VALORE DI DEFAULT
        formValue.value = null;
        //popolo gli inputs:

        // valori
        self.InternalPanel.formInputValues.push(formValue);
        //input
        self.InternalPanel.forminputs.push(input);
        id+=1;
      });
    });
  };
};

inherit(SearchPanel, Panel);

//search query
SearchQueryService.on("searchresults",function(results){
  var listPanel = new ListPanel({
    name: "Risultati ricerca",
    id: 'nominatim_results',
    list: results,
    listPanelComponent: SearchResultPanelComponent
  });
  GUI.showListing(listPanel);
});

module.exports = SearchPanel;
