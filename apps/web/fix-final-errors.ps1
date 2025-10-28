# Fix remaining TypeScript errors
Write-Output "Fixing remaining TypeScript errors..."

# Fix ChatPage.tsx - remove unused imports
$chatPageContent = Get-Content "src/pages/ChatPage.tsx" -Raw
$chatPageContent = $chatPageContent -replace '  Download,\r?\n', ''
$chatPageContent = $chatPageContent -replace '  Share2,\r?\n', ''
$chatPageContent = $chatPageContent -replace '  Heart,\r?\n', ''
$chatPageContent = $chatPageContent -replace '  MessageCircle,\r?\n', ''
$chatPageContent = $chatPageContent -replace '  Repeat2\r?\n', ''
$chatPageContent = $chatPageContent -replace 'import \{ PostPreview \} from ''\.\.\/components\/Post\/PostPreview'';\r?\n', ''
$chatPageContent = $chatPageContent -replace 'const \{ generatePost, isLoading \} = usePostGeneration\(\);', 'const { generatePost } = usePostGeneration();'
$chatPageContent = $chatPageContent -replace 'const result = await generatePost\(', 'await generatePost('
Set-Content "src/pages/ChatPage.tsx" -Value $chatPageContent

# Fix HistoryPage.tsx - remove unused setPosts
$historyPageContent = Get-Content "src/pages/HistoryPage.tsx" -Raw
$historyPageContent = $historyPageContent -replace 'const \[posts, setPosts\] = useState<Post\[\]>\(', 'const [posts] = useState<Post[]>('
Set-Content "src/pages/HistoryPage.tsx" -Value $historyPageContent

# Fix SettingsPage.tsx - remove unused Globe
$settingsPageContent = Get-Content "src/pages/SettingsPage.tsx" -Raw
$settingsPageContent = $settingsPageContent -replace '  Globe,\r?\n', ''
Set-Content "src/pages/SettingsPage.tsx" -Value $settingsPageContent

# Fix Header.tsx - remove unused cn import
$headerContent = Get-Content "src/components/Layout/Header.tsx" -Raw
$headerContent = $headerContent -replace 'import \{ cn \} from ''\.\.\/\.\.\/utils\/cn'';\r?\n', ''
Set-Content "src/components/Layout/Header.tsx" -Value $headerContent

# Fix PostPreview.tsx - remove unused ExternalLink
$postPreviewContent = Get-Content "src/components/Post/PostPreview.tsx" -Raw
$postPreviewContent = $postPreviewContent -replace '  ExternalLink,\r?\n', ''
Set-Content "src/components/Post/PostPreview.tsx" -Value $postPreviewContent

Write-Output "All TypeScript errors fixed!"