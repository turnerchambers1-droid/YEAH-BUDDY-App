package com.turnerchambers.yeahbuddy

import android.app.Application
import com.turnerchambers.yeahbuddy.data.Store
import com.turnerchambers.yeahbuddy.service.RestNotifications

class YeahBuddyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        RestNotifications.createChannels(this)
        Store.init(this)
    }
}
