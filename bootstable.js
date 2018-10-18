/*
Bootstable
 @description  Javascript library to make HMTL tables editable, using Bootstrap
 @version 1.1
 @autor Tito Hinostroza
*/
  "use strict";
  //Global variables
  var params = null;  		//Parameters
  var colsEdi = null;
  var newColHtml = '<div class="btn-group pull-right ">'+
		'<button id="bEdit" type="button" class="btn btn-sm btn-primary" onclick="rowEdit(this);">' +
		'<span class="oi oi-pencil"></span>'+
		'</button>'+
		'<button id="bElim" type="button" class="btn btn-sm btn-danger" onclick="rowElim(this);">' +
		'<span class="oi oi-trash"></span>'+
		'</button>'+
		'<button id="bAcep" type="button" class="btn btn-sm btn-success" style="display:none;" onclick="rowAcep(this);">' + 
		'<span class="oi oi-check"></span>'+
		'</button>'+
		'<button id="bCanc" type="button" class="btn btn-sm btn-warning" style="display:none;" onclick="rowCancel(this);">' + 
		'<span class="oi oi-x"></span>'+
		'</button>'+
    '</div>';
  var colEdicHtml = '<td name="buttons">'+newColHtml+'</td>'; 
    
  $.fn.SetEditable = function (options) {
    var defaults = {
        columnsEd: null,         	// Index to editable columns. If null all td editable. Ex.: "1,2,3,4,5"
        addButton: null,        	// Jquery object of "Add" button
		csvButton: null,			// Jquery object of "CSV" button
        onEdit: function() {},   	// Called after edition
		onCancel: function() {},	// Called after cancel
		onBeforeDelete: function() {}, // Called before deletion
        onDelete: function() {}, 	// Called after deletion
        onAdd: function() {}     	// Called when added a new row
    };
    params = $.extend(defaults, options);
    this.find('thead tr').append('<th name="buttons"></th>');  // empty header
    this.find('tbody tr').append(colEdicHtml);
	var $tabedi = this;   // Read reference to the current table, to resolve "this" here.
	
    //Process "addButton" parameter
    if (params.addButton != null) {
        // Parameter was provided
        params.addButton.click(function() {
            rowAddNew($tabedi.attr("id"));
        });
    }
	
    //Process "addButton" parameter
    if (params.csvButton != null) {
        // Parameter was provided
        params.csvButton.click(function() {
            console.log(TableToCSV($tabedi.attr("id"), ";"));
        });
    }
	
    //Process "columnsEd" parameter
    if (params.columnsEd != null) {
        // Extract felds
        colsEdi = params.columnsEd.split(',');
    }
  };
function IterarCamposEdit($cols, tarea) {
	// repeat for the editable fields of a row
    var n = 0;
    $cols.each(function() {
        n++;
        if ($(this).attr('name')=='buttons') return;  // excludes button column
        if (!EsEditable(n-1)) return;   // no fieds editable
        tarea($(this));
    });
    
    function EsEditable(idx) {
		// Indicates if the last column is set to be editable
        if (colsEdi==null) {  // it was not defined
            return true;  // all are editable
        } else {  // there are fields filter
            for (var i = 0; i < colsEdi.length; i++) {
              if (idx == colsEdi[i]) return true;
            }
            return false;  // It was not found
        }
    }
}
function FijModoNormal(but) {
    $(but).parent().find('#bAcep').hide();
    $(but).parent().find('#bCanc').hide();
    $(but).parent().find('#bEdit').show();
    $(but).parent().find('#bElim').show();
    var $row = $(but).parents('tr');  // access the row
    $row.attr('id', '');  // remove mark
}
function FijModoEdit(but) {
    $(but).parent().find('#bAcep').show();
    $(but).parent().find('#bCanc').show();
    $(but).parent().find('#bEdit').hide();
    $(but).parent().find('#bElim').hide();
    var $row = $(but).parents('tr');  // access the row
    $row.attr('id', 'editing');  // indicates that it is in edition
}
function ModoEdicion($row) {
    if ($row.attr('id')=='editing') {
        return true;
    } else {
        return false;
    }
}
function rowAcep(but) {	// Accept changes to the edition
    var $row = $(but).parents('tr');  // access the row
    var $cols = $row.find('td');  // read fields
	var $values = {};  // store values
	
    if (!ModoEdicion($row)) return;  // It is already in edition
    // It is in edition. The edition must be finalized
    IterarCamposEdit($cols, function($td) {  // iterate through the columns
	  var key = $td.find('input').attr('id')
      var cont = $td.find('input').val(); // read input content
      $td.html(cont);  // fixes content and removes controls
    });
    FijModoNormal(but);
	
	$cols.each(function(cellIndex) {
		if ($(this).attr('name')!='buttons') {
			var $field = $(this).data()['field']; // read td data-field attribute
			if (!$field) { $field = cellIndex; } // use cellIndex if data-field not exists
			
			$values[$field] = $(this).html();
		}
	})
	
	
    params.onEdit( $values ); // return json of changed data JSON.stringify(
}
function rowCancel(but) { // Reject changes to the edition
    var $row = $(but).parents('tr');  // access the row
    var $cols = $row.find('td');  // read fields
    if (!ModoEdicion($row)) return;  // It is already in edition
    // It is in edition. The edition must be finalized
    IterarCamposEdit($cols, function($td) {  // iterate through the columns
        var cont = $td.find('div').html(); // read div content
        $td.html(cont);  // fixes content and removes controls
    });
    FijModoNormal(but);
	params.onCancel($row);
}
function rowEdit(but) {  // Start editing a row
    var $row = $(but).parents('tr');  // access the row
    var $cols = $row.find('td');  // read fields
    if (ModoEdicion($row)) return;  // It is already in edition
    // Put in edit mode
    IterarCamposEdit($cols, function($td) {  // iterate through the columns
        var cont = $td.html(); // read content
        var div = '<div style="display: none;">' + cont + '</div>';  // save content
        var input = '<input class="form-control input-sm"  value="' + cont + '">';
        $td.html(div + input);  // fixed content
    });
    FijModoEdit(but);
}
function rowElim(but) {  // Delete the current row
    var $row = $(but).parents('tr');  // access the row
	var $cols = $row.find('td');  // read fields
    var $return =  params.onBeforeDelete($row);
	var $values = {};  // store values

	$cols.each(function(cellIndex) {
		if ($(this).attr('name')!='buttons') {
			var $field = $(this).data()['field']; // read td data-field attribute
			if (!$field) { $field = cellIndex; } // use cellIndex if data-field not exists
			
			$values[$field] = $(this).html();
		}
	})
	
	if ($return != false) {
		$row.remove();
		params.onDelete($values);
	}
}
function rowAddNew(tabId) {  // Add row to the indicated table.

	var $tab_en_edic = $("#" + tabId);  // Table to edit
    var $filas = $tab_en_edic.find('tbody tr');
    if ($filas.length==0) {
        // There are no rows of data. You have to create them complete
        var $row = $tab_en_edic.find('thead tr');  // header
        var $cols = $row.find('th');  // read fields
        // build html
        var htmlDat = '';
        $cols.each(function() {
            if ($(this).attr('name')=='buttons') {
                // It is column of buttons
                htmlDat = htmlDat + colEdicHtml;  // add buttons
            } else {
                htmlDat = htmlDat + '<td></td>';
            }
        });
        $tab_en_edic.find('tbody').append('<tr>'+htmlDat+'</tr>');
    } else {
        // There are other rows, we can clone the last row, to copy the buttons
        var $ultFila = $tab_en_edic.find('tbody tr:first');
        $ultFila.clone().prependTo($ultFila.parent());  
        $ultFila = $tab_en_edic.find('tbody tr:first');
        var $cols = $ultFila.find('td');  // read fields
        $cols.each(function() {
            if ($(this).attr('name')=='buttons') {
                // It is column of buttons
            } else {
                $(this).html('');  // clean content
            }
        });
    }
	params.onAdd();
}
function TableToCSV(tabId, separator) {  // Convert table to CSV
    var datFil = '';
    var tmp = '';
	var $tab_en_edic = $("#" + tabId);  // Table source
    $tab_en_edic.find('tbody tr').each(function() {
        // Finish the edition if it exists
        if (ModoEdicion($(this))) {
            $(this).find('#bAcep').click();  // accept edition
        }
        var $cols = $(this).find('td');  // read fields
        datFil = '';
        $cols.each(function() {
            if ($(this).attr('name')=='buttons') {
                // It is column of buttons
            } else {
                datFil = datFil + $(this).html() + separator;
            }
        });
        if (datFil!='') {
            datFil = datFil.substr(0, datFil.length-separator.length); 
        }
        tmp = tmp + datFil + '\n';
    });
    return tmp;
}
