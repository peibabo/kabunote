#!/bin/bash

git pull --prune
git branch | grep -v "main" | xargs git branch -D
