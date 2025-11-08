#!/bin/bash

# Monitor ACM certificate validation and update CloudFront distribution
# For matasaa.co.za migration to CloudFront

CERT_ARN="arn:aws:acm:us-east-1:534712420350:certificate/ee75eabc-af3f-41b1-9eda-6ad9bf79d996"
DISTRIBUTION_ID="EC0B0NMDAA981"
DOMAIN_NAME="matasaa.co.za"
MAX_ATTEMPTS=30  # 30 minutes max

echo "🔍 Monitoring ACM certificate validation for ${DOMAIN_NAME}..."
echo "Certificate ARN: ${CERT_ARN}"
echo "CloudFront Distribution: ${DISTRIBUTION_ID}"
echo ""

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "[Attempt $attempt/$MAX_ATTEMPTS] Checking certificate status..."

    STATUS=$(aws acm describe-certificate \
        --certificate-arn ${CERT_ARN} \
        --region us-east-1 \
        --query 'Certificate.Status' \
        --output text)

    echo "Status: ${STATUS}"

    if [ "${STATUS}" == "ISSUED" ]; then
        echo ""
        echo "✅ Certificate validated and issued!"
        echo ""
        echo "📝 Updating CloudFront distribution with custom domain and SSL..."

        # Get current CloudFront distribution config
        aws cloudfront get-distribution-config \
            --id ${DISTRIBUTION_ID} \
            --output json > /tmp/cf-config.json

        # Extract ETag
        ETAG=$(jq -r '.ETag' /tmp/cf-config.json)

        # Update config with alternate domain names and certificate
        jq '.DistributionConfig.Aliases.Quantity = 2 |
            .DistributionConfig.Aliases.Items = ["matasaa.co.za", "www.matasaa.co.za"] |
            .DistributionConfig.ViewerCertificate.ACMCertificateArn = "'${CERT_ARN}'" |
            .DistributionConfig.ViewerCertificate.SSLSupportMethod = "sni-only" |
            .DistributionConfig.ViewerCertificate.MinimumProtocolVersion = "TLSv1.2_2021" |
            .DistributionConfig.ViewerCertificate.Certificate = "'${CERT_ARN}'" |
            .DistributionConfig.ViewerCertificate.CertificateSource = "acm" |
            del(.DistributionConfig.ViewerCertificate.CloudFrontDefaultCertificate)' \
            /tmp/cf-config.json | jq '.DistributionConfig' > /tmp/cf-config-updated.json

        # Update CloudFront distribution
        aws cloudfront update-distribution \
            --id ${DISTRIBUTION_ID} \
            --distribution-config file:///tmp/cf-config-updated.json \
            --if-match ${ETAG}

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ CloudFront distribution updated successfully!"
            echo ""
            echo "⏳ Waiting for CloudFront deployment (this takes 5-10 minutes)..."
            echo ""
            echo "📍 Your site will be available at:"
            echo "   - https://matasaa.co.za"
            echo "   - https://www.matasaa.co.za"
            echo "   - https://d98eujsearmkf.cloudfront.net (always works)"
            echo ""
            echo "💡 You can monitor deployment status at:"
            echo "   https://console.aws.amazon.com/cloudfront/v3/home#/distributions/${DISTRIBUTION_ID}"
        else
            echo "❌ Failed to update CloudFront distribution"
            exit 1
        fi

        # Clean up
        rm -f /tmp/cf-config.json /tmp/cf-config-updated.json

        exit 0
    fi

    echo "⏳ Still pending validation. Waiting 60 seconds..."
    echo ""
    sleep 60
    attempt=$((attempt + 1))
done

echo ""
echo "❌ Certificate validation timed out after $MAX_ATTEMPTS minutes"
echo "Please check AWS Console: https://console.aws.amazon.com/acm/home?region=us-east-1"
exit 1
