pipeline {
    agent any
    
    parameters {
        string(name: 'BRANCH', defaultValue: 'master', description: 'Branch to deploy')
        choice(name: 'ENVIRONMENT', choices: ['production', 'staging'], description: 'Deployment environment')
    }
    
    environment {
        S3_BUCKET = 'matasaa-co-za-website'
        CLOUDFRONT_ID = 'EC0B0NMDAA981'
        AWS_REGION = 'af-south-1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH}", url: 'https://github.com/NkululekoMbhele/matasaa.co.za.git'
            }
        }
        
        stage('Build') {
            steps {
                echo "Building static site from branch: ${params.BRANCH}"
                echo "Target environment: ${params.ENVIRONMENT}"
                sh 'ls -la'
            }
        }
        
        stage('Deploy to S3') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'aws-deployment-user', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    echo "Deploying to S3 bucket: ${S3_BUCKET}"
                    sh """
                        aws s3 sync . s3://${S3_BUCKET}/ \
                            --region ${AWS_REGION} \
                            --exclude ".git/*" \
                            --exclude "*.md" \
                            --exclude "Jenkinsfile" \
                            --exclude "*.log" \
                            --exclude ".gitignore" \
                            --exclude "monitor_and_deploy.sh"
                    """
                }
            }
        }

        stage('Invalidate CloudFront') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'aws-deployment-user', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    echo "Invalidating CloudFront distribution: ${CLOUDFRONT_ID}"
                    sh """
                        aws cloudfront create-invalidation \
                            --distribution-id ${CLOUDFRONT_ID} \
                            --paths '/*'
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Deployment successful!"
            echo "Site available at: https://matasaa.co.za"
            echo "CloudFront URL: https://d98eujsearmkf.cloudfront.net"
        }
        failure {
            echo "❌ Deployment failed. Check logs for details."
        }
    }
}
