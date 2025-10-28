const fs = require('fs');
const path = require('path');

// Lista de arquivos e correções a serem feitas
const fixes = [
  {
    file: 'src/pages/ChatPage.tsx',
    fixes: [
      {
        search: /import { [\s\S]*?Repeat2[\s\S]*?} from 'lucide-react';/,
        replace: `import { 
  Send, 
  Paperclip, 
  Sparkles, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';`
      },
      {
        search: /import { PostPreview } from '\.\.\/components\/Post\/PostPreview';\n/,
        replace: ''
      },
      {
        search: /const { generatePost, isLoading } = usePostGeneration\(\);/,
        replace: 'const { generatePost } = usePostGeneration();'
      },
      {
        search: /const result = await generatePost\(/,
        replace: 'await generatePost('
      }
    ]
  },
  {
    file: 'src/pages/HistoryPage.tsx',
    fixes: [
      {
        search: /const \[posts, setPosts\] = useState<Post\[\]>\(/,
        replace: 'const [posts] = useState<Post[]>('
      }
    ]
  },
  {
    file: 'src/pages/PreviewPage.tsx',
    fixes: [
      {
        search: /import React, { useState, useEffect } from 'react';/,
        replace: "import { useState, useEffect } from 'react';"
      },
      {
        search: /import { [\s\S]*?Download,[\s\S]*?Share2,[\s\S]*?} from 'lucide-react';/,
        replace: `import { 
  ArrowLeft, 
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';`
      },
      {
        search: /import { toast } from 'sonner';\n/,
        replace: ''
      }
    ]
  },
  {
    file: 'src/pages/SettingsPage.tsx',
    fixes: [
      {
        search: /import { Save, User, Palette, Bell, Shield, Globe } from 'lucide-react';/,
        replace: "import { Save, User, Palette, Bell, Shield } from 'lucide-react';"
      }
    ]
  },
  {
    file: 'src/components/Layout/Header.tsx',
    fixes: [
      {
        search: /import React from 'react';\n/,
        replace: ''
      }
    ]
  }
];

// Aplicar correções
fixes.forEach(({ file, fixes: fileFixes }) => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    fileFixes.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('All fixes applied!');