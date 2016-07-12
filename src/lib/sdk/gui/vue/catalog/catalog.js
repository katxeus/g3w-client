var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var t = require('core/i18n/i18n.service').t;
var resolve = require('core/utils/utils').resolve;
var Component = require('gui/vue/component');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');
var ProjectService = require('core/project/projectservice').ProjectService;

var vueComponentOptions = {
  template: require('./catalog.html'),
  data: function() {
    return {
      state: ProjectService.state
    }
  },
  computed: {
    layerstree: function(){
      return this.state.project.layerstree;
    },
    baselayers: function(){
      return this.state.baseLayers;
    },
    hasBaseLayers: function(){
      return this.state.baseLayers.length>0;
    }
  },
  methods: {
    setBaseLayer: function(id) {
      ProjectService.setBaseLayer(id);
    }
  }
}

// se lo voglio istanziare manualmente
var InternalComponent = Vue.extend(vueComponentOptions);

// se lo voglio usare come componente come elemento html
//Vue.component('g3w-catalog', vueComponentOptions);


/* COMPONENTI FIGLI */

// tree component


Vue.component('tristate-tree', {
  template: require('./tristate-tree.html'),
  props: {
    layerstree: [],
    //eredito il numero di childs dal parent
    n_parentChilds : 0,
    checked: false
  },
  data: function () {
    return {
      expanded: this.layerstree.expanded,
      parentChecked: false,
      //proprieta che serve per fare confronto per il tristate
      n_childs: this.layerstree.nodes ? this.layerstree.nodes.length : 0
    }
  },
  watch: {
      'checked': function (val){
        this.layerstree.visible = val;
      }
  },
  computed: {
    isFolder: function () {
      var isFolder = this.n_childs ? true : false;
      if (isFolder) {
        var _visibleChilds = 0;
        _.forEach(this.layerstree.nodes,function(layer){
          if (layer.visible){
            _visibleChilds += 1;
          }
        });
        this.n_parentChilds = this.n_childs - _visibleChilds;
      }
      return isFolder
    },
    isHidden: function() {
      return this.layerstree.hidden && (this.layerstree.hidden === true);
    }
  },
  methods: {
    toggle: function (checkAllLayers) {
      var checkAll = checkAllLayers == 'true' ? true : false;
      if (this.isFolder && !checkAll) {
        this.layerstree.expanded = !this.layerstree.expanded;
      }
      else if (checkAll){
        if (this.parentChecked && !this.n_parentChilds){
          this.parentChecked = false;
        } else if (this.parentChecked && this.n_parentChilds) {
          this.parentChecked = true;
        }
        else {
          this.parentChecked = !this.parentChecked;
        }
        ProjectService.toggleLayers(this.layerstree.nodes,this.parentChecked);
      }
      else {
        ProjectService.toggleLayer(this.layerstree);
      }
    },
    triClass: function () {
      if (!this.n_parentChilds) {
        return 'fa-check-square-o';
      } else if ((this.n_parentChilds > 0) && (this.n_parentChilds < this.n_childs)) {
        return 'fa-square';
      } else {
        return 'fa-square-o';
      }
    }
  }
})

Vue.component('legend',{
    template: require('./legend.html'),
    props: ['layerstree'],
    data: function() {
      return {
        //data qui
      }
    },
    computed: {
      visiblelayers: function(){
        var _visiblelayers = [];
        var layerstree = this.layerstree;
        function traverse(obj){
        _.forIn(obj, function (layer, key) {
              //verifica che il valore dell'id non sia nullo
              if (!_.isNil(layer.id) && layer.visible) {
                  _visiblelayers.push(layer);
              }
              if (!_.isNil(layer.nodes)) {
                  traverse(layer.nodes);
              }
          });
        }
        traverse(layerstree);
        return _visiblelayers;
      }
    },
    watch: {
      'layerstree': {
        handler: function(val, old){
          //codice qui
        },
        deep: true
      }
    },
    ready: function() {
      //codice qui
    }
});

Vue.component('legend-item',{
  template: require('./legend_item.html'),
  props: ['layer'],
  computed: {
    legendurl: function(){
      // in attesa di risolvere lo schianto di QGSI Server...
      //return "http://localhost/cgi-bin/qgis_mapserv.fcgi?map=/home/giohappy/Scrivania/Dev/G3W/g3w-client/test/progetto/test.qgs&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYERTITLE=False&ITEMFONTSIZE=10&LAYER="+this.layer.name;
      return ProjectService.getLegendUrl(this.layer);
    }
  },
  methods: {
    // esempio utilizzo del servizio GUI
    openform: function(){
      //GUI.notify.success("Apro un form");
      //GUI.showForm();
    }
  }
});

/* FINE COMPONENTI FIGLI */


/* INTERFACCIA PUBBLICA */
function CatalogComponent(options){
  base(this,options);
  this.id = "iternet-editing-panel";
  this.title = "Catalogo dati";
  this.InternalComponent = InternalComponent;
}
inherit(CatalogComponent, Component);

module.exports = CatalogComponent;