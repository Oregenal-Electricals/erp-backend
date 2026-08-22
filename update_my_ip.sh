#!/bin/bash
# Updates the "my IP" inbound rule on both dev and staging RDS security
# groups to your CURRENT public IP - run this any time local psql/backend
# can't reach RDS after your internet reconnects with a new IP.
#
# Usage: ./update_my_ip.sh

set -e

REGION="ap-south-1"
DEV_SG="sg-078f68ffeb38acdfa"
STAGING_SG="sg-0181127670334fa4d"

CURRENT_IP=$(curl -s -4 ifconfig.me)
if [ -z "$CURRENT_IP" ]; then
  echo "Could not detect current public IP - check your internet connection"
  exit 1
fi
echo "Current public IP: $CURRENT_IP"

update_sg() {
  local SG_ID=$1
  local LABEL=$2

  OLD_RULES=$(aws ec2 describe-security-groups --group-ids "$SG_ID" --region "$REGION" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`].IpRanges[?CidrIp!=null].CidrIp" \
    --output text 2>/dev/null || true)

  for OLD_IP in $OLD_RULES; do
    if [ "$OLD_IP" != "${CURRENT_IP}/32" ]; then
      echo "  Removing stale rule for $LABEL: $OLD_IP"
      aws ec2 revoke-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5432 --cidr "$OLD_IP" --region "$REGION" > /dev/null 2>&1 || true
    fi
  done

  ALREADY_PRESENT=$(aws ec2 describe-security-groups --group-ids "$SG_ID" --region "$REGION" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`].IpRanges[?CidrIp=='${CURRENT_IP}/32'].CidrIp" \
    --output text 2>/dev/null || true)

  if [ -z "$ALREADY_PRESENT" ]; then
    echo "  Adding current IP to $LABEL"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5432 --cidr "${CURRENT_IP}/32" --region "$REGION" > /dev/null
  else
    echo "  $LABEL already allows this IP - nothing to do"
  fi
}

update_sg "$DEV_SG" "dev RDS"
update_sg "$STAGING_SG" "staging RDS"

echo "Done. Your current IP ($CURRENT_IP) is now whitelisted on both dev and staging RDS."
