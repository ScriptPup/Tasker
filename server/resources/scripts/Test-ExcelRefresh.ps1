    <#
======================
Function Name: Run-RefreshExcel
Version: 1.0
Author: Ethan Hammond
Updated: 07/18/2017
======================
#> 
Param(
    [Parameter(Mandatory=$True,Position=1)]
    [String]$Path,
    [Parameter(Mandatory=$false)]
    [String]$Worksheet,
    [Parameter(Mandatory=$false)]
    [String]$Range,
    [Parameter(Mandatory=$false)]
    [switch]$LastModified
)  
$start_check = Get-Date;
$scheck = Get-Date -Format "MM/dd/yyyy hh:mm:ss";
if(!$LastModified -and ($Worksheet -and $Range)){
    Write-Verbose "Verifying via excel cell dates";
    $ExcelCom = New-Object -comobject Excel.Application;    # Start excel using COM object
    $ExcelCom.DisplayAlerts = $false;                       # Turn off all pop-ups so that script runs uninterupted.
    $ExcelCom.Visible = $false;                              # If this is set to false, saving the file on a network share will fail. Reason : Unknown.
       
    if($ExcelCom._Default -ne "Microsoft Excel"){ throw "Excel com object appears to be corrupt. Contact the script writer."; return $false; } # Validate that excel Com is actually an excel Com.
    $excelWorkbook = $ExcelCom.workbooks.Open($Path,$null,$true);
    
    While(!($excelWorkbook.worksheets) -or $excelWorkbook.worksheets.Count -lt 1){ } 
        if($Worksheet -and $Range){   
            Write-Verbose "Worksheet and range both detected, commencing search";
            # Get range by name and sheet
            $SearchRangeRange = $excelWorkbook.worksheets[$Worksheet].Range($Range)
            # Get range by name and sheet
            $rawMAXDate = $ExcelCom.WorksheetFunction.Max($SearchRangeRange);
            $MAXDate = (Get-Date([DateTime]::FromOADate($rawMAXDate))).ToString("MM/dd/yyyy");
            Write-Output "Last date in '$Worksheet.$Range' is: $MAXDate";
            return;
        }
    $ExcelCom.Quit()|Out-Null;                                                           # Quit using excel's built in method, this does not get rid of the COM object.
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ExcelCom)|Out-Null;      # Destroy excel com object, drop it from runstack.
}
else {
    Write-Output ("File last modified: "+(Get-Item -Path $Path).LastWriteTime);
    return;
}

$end_check = Get-Date;
$eCheck = Get-Date -Format "MM/dd/yyyy hh:mm:ss";
$check_time = New-TimeSpan -Start $start_check -End $end_check;
       
<#
Write-Output "Check Time: $check_time";
Write-Output "Check Start: $scheck";
Write-Output "Check End: $eCheck";
#>
