try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = "C:\ticketing-system\DBMS_Project_Report.docx"
    $doc = $word.Documents.Open($docPath)
    $pages = $doc.ComputeStatistics(2)
    Write-Host "PAGES_RESULT:$pages"
    $doc.Close([ref]$false)
    $word.Quit()
} catch {
    Write-Host "ERROR: $_"
}
