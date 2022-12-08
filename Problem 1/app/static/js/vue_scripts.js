const app = new Vue({
  el: '#app',
  delimiters: ['[[', ']]'],

  /* Data  -------------------------------------------------------------------*/
  data: {
    title: 'The Benny App',
    // dist curves  ------------//
    benfordCurve: [30.1,17.6,12.5,9.7,7.9,6.7,5.8,5.1,4.6],
    bennyCurve: [0,0,0,0,0,0,0,0,0],

    // csv preview file  ------//
    csvPreviewFile: {},
    csvPreviewFilename: '',
    csvPreviewRawFileSize: 0,
    csvPreviewHeaders: [],
    csvPreviewData: [],
    csvPreviewSlice: 6,
    csvPreviewAlert: false,
    switchStatus: false,

    // csv file  --------------//
    csvFile: {},
    csvFilename: '',
    csvFilesize: 0,
    csvHeaders: [],
    csvData: [],
    csvRawFileSize: 0,
    csvLibDescription: '',

    // tabulator  -------------//
    dataIsLoaded: false,
    tabulator: null,
    tabulatorColumns: [],
    tabulatorData: [],
    headerMenu: headerMenu,
    selectedField: '',
    selectedFieldName: '',

    // highcharts  ------------//
    highchart: null,
    chartOptions: chartOptions,
    galleryBennies: [],
    containerIds: [],
    galleryBennyCount: 1,

    // lib import modal  ------//
    libCsvMenu: [],
    libCsvChoice: '',

    // benny report info  -----//
    bennyStatus: '',
    chiSqrStatLimit: 8,
    chiSqrStat: 0,
    chiStatColor: 'green',
    showResultsInfo: false,
    bennyStats: {},

    // general  ---------------//
    inputFilename: '',  // <-- the input field on 'local' import modal
    links: {
      linkedin: 'https://www.linkedin.com/in/stcybrdgs/',
      github: 'https://github.com/stcybrdgs/benapp_fin',
      dockerImage: 'https://hub.docker.com/r/stcybrdgs/scb-apps/tags',
      tabulatorSite: 'http://tabulator.info/',
      highchartsSite: 'https://www.highcharts.com/'
    },
  },

  /* Watchers  ---------------------------------------------------------------*/
  watch: {
    chiSqrStat: function() {
      this.chiStatColor = this.chiSqrStat < this.chiSqrStatLimit ? 'green' : 'red';
    },

    tabulatorColumns:{
      // update the tabulabor headers when a new csv is loaded
      handler: function (newData) {
        this.tabulator.setColumns(newData);
      }
    },

    tabulatorData:{
      // update the tabulator records when a new csv is loaded
      handler: function (newData) {
        this.tabulator.replaceData(newData);
      }
    },

    inputFilename: function(){
      if( this.inputFilename == '' ) {
        console.log('inputFilename is null');
        this.clearCsvPreview();
      }
    }

  },

  /* Computed  ---------------------------------------------------------------*/
  computed: {
    inputPreviewLength: function(){
      // set how many rows to show in the csv preview (per the 'local' import modal)
      return  this.csvData.length < this.csvPreviewSlice ?
              this.csvData.length :
              this.csvPreviewSlice;
    },

    csvPreviewFileSize: function(){
      // return the size in the csv preview (per the 'local' import modal)
      var size =  Math.round(this.csvPreviewRawFileSize/1000) < 1 ?
                  Number.parseFloat(this.csvPreviewRawFileSize/1000).toFixed(2) :
                  Math.round(this.csvPreviewRawFileSize/1000);
      return size.toString();
    },

    csvFileSize: function(){
      // return the size in the csv preview (per the 'local' import modal)
      var size =  Math.round(this.csvRawFileSize/1000) < 1 ?
                  Number.parseFloat(this.csvRawFileSize/1000).toFixed(2) :
                  Math.round(this.csvRawFileSize/1000);
      return size.toString();
    }
  },

  /* Methods  ----------------------------------------------------------------*/
  methods: {
    downloadTable: function() {
      if( this.dataIsLoaded ){
        this.tabulator.download("csv", this.csvFilename)
      } else{
        Notiflix.Notify.Failure('No data !')
      }
    },

    getInclusionsReport: function(){
      // use a time variable to fool the browser into not cacheing the report
      var time = moment().format('hhmmss');

      // download inclusions csv from server
      window.location = "/getInclusionsReport/".concat(time);

      // notify user that download was received
      Notiflix.Notify.Success('The Inclusions Report was downloaded !')
    },

    setLibCsvChoice: function(event) {
      this.libCsvChoice = event.target.value;
    },

    selectField: function(header) {
      // highlight the table field whenever the user selects it from the drop menu
      var colDefs = this.tabulator.getColumnDefinitions();
      var colElems = document.getElementsByClassName('tabulator-col');
      var field = ''
      for( def of colDefs ){
      	if ( def.title == header ) {
          for ( var colElem of colElems ) {
          	if ( colElem.getAttribute('tabulator-field') == def.field){
              // set the field name so that getBenny() can pick up the data if called
              this.selectedFieldName = def.field;

              // if a different field was previously selected, toggle style off
              if( this.selectedField.length != '' ) {
                this.selectedField.classList.toggle('tabulator-title-selected');
              }
              // set selected field to the newly selected element and toggle style on
              this.selectedField = colElem.firstChild;
              this.selectedField.classList.toggle('tabulator-title-selected');
              this.okToClearField =true;
            	break;
            }
          }
        }
      }
    },

    getBenny: function () {
      if( this.selectedFieldName == '' ) {
        // if user tries to get a benny without selecting a field, throw an alert
        Notiflix.Notify.Failure('Choose a field to get a Benny.');
      } else {
        Notiflix.Notify.Info('Getting your Benny...');

        // get the column data for the user-selected field
        var colDefs = this.tabulator.getColumnDefinitions();
        var tabledata = this.tabulator.getData()
        var coldata = [];
        for( var def of colDefs){
          if( def.field == this.selectedFieldName ) {
            // var field = def.title
          	for( var row of tabledata ) {
              coldata.push( row[def.field] );
            }
            break;
          }
        }

        // send the column data to the server for benford analysis
        axios.post('/getBenfordAnalysis', { params: coldata} )
        .then( (res) => {

          // ------------------------------------------------------------------
          // dist, stats (totRows, keptRows, droppedRows), chisqr
          this.bennyCurve = res.data.dist;
          var chartPoints = res.data.dist;
          this.chiSqrStat = res.data.chisqr;
          this.bennyStats = res.data.stats;

          // ------------------------------------------------------------------
          // update the data in the chart 'highchart' in the vue data layer
          this.chartOptions.title.text = this.csvFilename;  // update the chart title
          this.chartOptions.subtitle.text = 'field: ' + this.selectedFieldName;  // update the chart subtitle
          this.chartOptions.series[1].data = chartPoints;  // update the analysis data
          this.highchart = Highcharts.chart('container', this.chartOptions);  // initialize the highcharts object

          this.$nextTick( function(){
            // after the highchart resets, notify user of the new benny and open the benny report modal
            Notiflix.Notify.Success('You have a new Benny !');
            $("#bennyModal").modal();
          })
        });
      }
    },

    loadPreview: function(event){
      // use PapaParse library to parse the data from a newly imported csv file
      this.csvPreviewFile = event.target.files[0];  // <--the csv file object
      this.csvPreviewFilename = this.csvPreviewFile.name;  // <--the name of the imported csv file
      this.csvPreviewRawFileSize =  this.csvPreviewFile.size;  // <--the size of the imported csv file

      let self = this;
      Papa.parse( this.csvPreviewFile, {
        preview: 6,
        skipEmptyLines: 'greedy',  // skip null records
        encoding: "utf8",
        complete: function(results) {
          self.csvPreviewHeaders = results.data[0];  // <--the headers
          results.data.shift()  // pop the headers
          self.csvPreviewData = results.data;  // <--the data
        }
      });
    },

    clearCsvPreview: function(){
      // clear the preview on the 'local' import modal
      this.csvPreviewFile = {};
      this.csvPreviewFilename = '';
      this.inputFilename = '';
      this.csvPreviewRawFileSize = 0;
      this.csvPreviewHeaders = [];
      this.csvPreviewData = [];
      this.csvPreviewAlert = false;
      this.switchStatus = false;
    },

    addCsvToLibrary: function(results) {
      // if filename already exists on server, upload nothing and alert user
      if( this.libCsvMenu.includes(this.csvFilename) ){
        Notiflix.Notify.Failure('Not added to Library-- filename exists!');
      } else{
        //axios.post( 'http://localhost:8001/addCsvToLibrary', {
        axios.post( '/addCsvToLibrary', {
            'results': results.data,
            'filename': this.csvFilename,
        })
        // update menu on library import modal and toast user
        .then( (res) => {
          this.libCsvMenu.push(this.csvFilename);
          Notiflix.Notify.Success(res.data['msg']);
        });
      }
    },

    loadLocalCsv: function() {
      // load the header and record data from papaParse into the Tabulator table
      if ( this.csvPreviewFilename == '' ) {
        // if a local file was not selected, throw an error message,
        this.csvPreviewAlert = true;
      }
      else {
        // get data needed to load the csv into tabulator
        this.csvFile = this.csvPreviewFile;
        this.csvFilename = this.csvPreviewFilename;
        this.csvRawFileSize = this.csvPreviewRawFileSize;

        // parse the csv info and load into tabulator
        this.parseCsvForTabulator();

        // close the import modal
        $("#load-from-local").modal("hide");
      }
    },

    parseCsvForTabulator: function(){
      // parse csv data and load to tabulator
      // rem papa is asynch, so put all post tasks in the 'complete' callback
      let self = this;
      Papa.parse( this.csvFile, {
        encoding: "utf8",
        skipEmptyLines: 'greedy',  // skip null records
        complete: function(results) {
          if( results.errors.length > 0 ){
            // report any errors detected by papaparse
            Notiflix.Notify.Failure(results.errors[0].code + '- See console log');
            console.log('Parsing Error Type: ' + results.errors[0].type);
            console.log('Parsing Error Code: ' + results.errors[0].code);
            console.log('Parsing Error Info: ' + results.errors[0].message);
          }

          // push headers to vue data layer and clean them up to facilitate the tabulator display
          self.csvHeaders = results.data[0];   // <-- push the headers
          for( var head in self.csvHeaders ){  // if first char of head is a number, prepend an underscore
            if( !isNaN( self.csvHeaders[head] ) ){
              self.csvHeaders[head] = '_' + self.csvHeaders[head];
            }

            // if head has any special chars, replace them with underscore
            self.csvHeaders[head] = self.csvHeaders[head].replace(/[&\/\\#, +()$~%.'":*?<>{}]/g, '_');
          }

          // now that headers are cleaned, copy them back into csv object
          results.data[0] = self.csvHeaders;

          // if the 'Add file to Library' switch is on, then upload csv to server
          if ( self.switchStatus) {
            self.addCsvToLibrary(results);
            self.switchStatus = false;
          }

          // add csv data to vue data layer
          results.data.shift()  // pop the headers
          self.csvData = results.data;  // <--the data

          // load the parsed data into the tabulator
          self.loadTabulator();
        }
      });
    },

    loadTabulator: function() {
      // clear any filters that may exist from a previous table
      if( this.tabulatorColumns.length > 0 ){
        this.tabulator.clearFilter(true);  // clear any header filters
        this.tabulator.setGroupBy("");  // clear any groupings
      }

      // create an array to be pushed into Tabulator headers
      var tabCols = [];

      // add a column for each header
      for ( var head of this.csvHeaders ) {
        let tempObj = {};
        tempObj.title = head;
        tempObj.field = head.replace(' ', '').toLowerCase();
        tempObj.hozAlign = "left";
        tempObj.headerFilter = "input";
        tempObj.bottomCalc = "count";
        tempObj.headerMenu = this.headerMenu;
        tabCols.push(tempObj);
      }

      // create an array to be pushed into Tabulator data (ie, the table records)
      var tabData = [];
      for( var row of this.csvData) {
        let tempObj = {}
        for( var i in tabCols ) {
          tempObj[ tabCols[i].field ] = row[i];
        }
        tabData.push(tempObj);
      }
      // push the arrays into the Tabulator section of the Vue data layer
      this.tabulatorColumns = tabCols;
      this.tabulatorData = tabData;

      // reset selected file to none
      this.selectedField = '';
      this.selectedFieldName = '';
      this.dataIsLoaded = true;
    },

    plain: function(params){
      this.highchart.update( { chart: { type: 'column', inverted: false, polar:false }} );
  	},

    inverted: function(params){
      this.highchart.update( { chart: { type: 'column', inverted: true, polar:false }} );
  	},

    line: function(params){
      this.highchart.update( { chart: { type: 'line', inverted: false }} );
  	},

    getLibCsv: function() {
      axios.post( '/getLibCsv', { params: this.libCsvChoice } )
        .then( (res) => {
          this.csvFilename = this.libCsvChoice;
          this.csvHeaders = res.data['csvHeaders'];
          this.csvData = res.data['csvData'];
          this.csvRawFileSize = res.data['csvFileSize']
          this.loadTabulator();
        })
    },

  },

  /* Hooks  ------------------------------------------------------------------*/
  created: function(){
    // get the filenames of CSVs that are in the app library
    axios.post( '/getLibCsvMenu' )
      .then( (res) => {
        this.libCsvMenu = res.data.libCsvMenu
      });
  },

  mounted: function(){
    // after Vue mount, create new Tabulator and inject into id="tabulator-table" in index.html
    this.tabulator = new Tabulator(this.$refs.table, {
      height: "500px",
      movableColumns: true,
      layout: "fitColumns",
      //layout:"fitData",
      groupToggleElement:"header",  //toggle group on click anywhere in the group header
      groupStartOpen:false,
      placeholder: "<h3 class='text-light'>Awaiting Data</h3>",
      data: this.tabulatorData,
      columns: this.tabulatorColumns,
      reactiveData: true, //enable data reactivity
    });

    // initialize the highcharts object
    this.highchart = Highcharts.chart('container', this.chartOptions);
  }
});
