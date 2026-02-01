#!/bin/bash

cd /Users/dhanyabad/code2/ResuMatch-Ai

echo "Current branches:"
git branch -a

echo ""
echo "Deleting local branches..."
git branch -D latex
git branch -D feature/latex-resume-builder

echo ""
echo "Deleting remote branches..."
git push origin --delete latex
git push origin --delete feature/latex-resume-builder

echo ""
echo "✅ Cleanup complete! Remaining branches:"
git branch -a
