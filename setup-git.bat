@echo off
set REPO_NAME=the-blue
set GITHUB_USER=asmagsasp
set GITHUB_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo Configurando Git para %REPO_NAME%...
git init
git add .
git commit -m "Initial commit: The Blue Platform (Investment)"
git branch -M main
git remote add origin %GITHUB_URL%

echo.
echo PRONTO! Para enviar para o GitHub, digite:
echo git push -u origin main
echo.
echo Pressione uma tecla para sair.
pause
