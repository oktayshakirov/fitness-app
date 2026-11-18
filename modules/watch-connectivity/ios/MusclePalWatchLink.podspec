Pod::Spec.new do |s|
  s.name           = 'MusclePalWatchLink'
  s.version        = '1.0.0'
  s.summary        = 'Sends the recovery summary to the Muscle Pal Apple Watch app'
  s.description    = 'Sends the recovery summary to the Muscle Pal Apple Watch app'
  s.author         = ''
  s.homepage       = 'https://oktayshakirov.com'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity'
  s.source_files   = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
end
