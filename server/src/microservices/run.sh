# # backup your current crontab file
export backup_date=`date +20%y%m%d-%H%M%S`
crontab -l > backup/crontab.${backup_date}
# # create a copy of the crontab to edit
# crontab -l > backup/crontab.out
# # make the edit to create the new crontab file
# vi backup/crontab.out
# # this will request crontab to run using this new command file
crontab crontab.out
# # output crontab to validate your updates
crontab -l