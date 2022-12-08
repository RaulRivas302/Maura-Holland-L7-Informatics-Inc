/*
  This script configures labels and actions for the Tabulator header menu items:
    - Group By Values
    - Clear Groups
    - Delete Column
*/
var headerMenu = [
  {
    // Group By Values:
    // groups the table based on counts of unique values in the target column
    label: "<div class='text-info'><i class='fas fa-layer-group'></i>&nbsp;&nbsp;Group By Values</div>",
    action: function(e, column) {
      var colName = column.getField();
      var table = column.getTable();
      table.setGroupBy(colName)
  	},
  },
  {
    // Clear Groups:
    // removes the groupings on Tabulator and return it to a normal state
    label: "<div class='text-info'><i class='fas fa-sync-alt'></i>&nbsp;&nbsp;Clear Groups</div>",
    action: function(e, column) {
      var colName = column.getField();
      var table = column.getTable();
      table.setGroupBy("");
  	},
  },
  {
      separator:true,
  },
  {
    // Delete Column:
    // deletes the target column from Tabulator display
    // (the column is removed from DOM for current session but persists in server-side data store)
    label: "<div class='text-info'><i class='fas fa-trash'></i>&nbsp;&nbsp;Delete Column</div>",
    action: function(e, column) {
      column.delete()
  	},
  },
];
