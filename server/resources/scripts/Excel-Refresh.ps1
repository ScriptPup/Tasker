Param (
    [String]$Path
)
function Run-RefreshExcel {
         <#
        ======================
        Function Name: Run-RefreshExcel
        Version: 1.0
        Author: Ethan Hammond
        Updated: 12/02/2015
        ======================
       #> 
       Param(
        [Parameter(Mandatory=$True,Position=1)]
        [String]$Path
       )  
       $start_refresh = Get-Date;
       $ExcelCom = New-Object -comobject Excel.Application;    # Start excel using COM object
       $ExcelCom.DisplayAlerts = $false;                       # Turn off all pop-ups so that script runs uninterupted.
       $ExcelCom.Visible = $false;                              # If this is set to false, saving the file on a network share will fail. Reason : Unknown.

       $checked_in = $false;
       
       if($ExcelCom._Default -ne "Microsoft Excel"){ throw "Excel com object appears to be corrupt. Contact the script writer."; return $false; } # Validate that excel Com is actually an excel Com.
       $excelWorkbook = $ExcelCom.workbooks.Open($Path);
       if ($ExcelCom.workbooks.CanCheckOut($Path)) { 
           $excelWorkbook = $ExcelCom.workbooks.CheckOut($Path);
           $excelWorkbook = $ExcelCom.workbooks.Open($Path);
           $checked_in = $true;
       } else { $excelWorkbook = $ExcelCom.workbooks.Open($Path); }
       While($excelWorkbook.ReadOnly -ne $false){ }
       foreach ($cnn in $excelWorkbook.Connections)
        {
            if ($cnn.Type.ToString() -eq "xlConnectionTypeODBC")
            {
                $cnn.ODBCConnection.BackgroundQuery = $false | Out-Null;
            }
            else
            {
                $cnn.OLEDBConnection.BackgroundQuery = $false | Out-Null;
            }
        }
       $excelWorkbook.RefreshAll();
       $excelWorkbook.Save();
       if ($excelWorkbook.CanCheckIn -and $checked_in -eq $true){ $excelWorkbook.CheckIn(); }

       $end_refresh = Get-Date;
       $eRefresh = Get-Date -Format "MM/dd/yyyy hh:mm:ss";
       $refresh_time = New-TimeSpan -Start $start_refresh -End $end_refresh;
       
       $ExcelCom.Quit()|Out-Null;                                                           # Quit using excel's built in method, this does not get rid of the COM object.
       [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ExcelCom)|Out-Null;      # Destroy excel com object, drop it from runstack.

       Write-Output "Refresh Time: $refresh_time";
       Write-Output "Refresh Start: $start_refresh";
       Write-Output "Refresh End: $eRefresh";
};
Run-RefreshExcel -Path $Path;