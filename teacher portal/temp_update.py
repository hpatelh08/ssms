import re

path = 'e:/intership/teacher portal/client/src/components/Teacher/Dashboard.js'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">.*?(?=^\s*<div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">)'

replacement = '''<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 font-medium">Absent Students</p>
                <h3 className="text-3xl font-bold mt-2">12</h3>
                <p className="text-blue-100 text-sm mt-2 flex items-center gap-1 font-medium bg-blue-400/30 w-max px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Today
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-center">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-indigo-100 font-medium">Performance Analysis</p>
                <h3 className="text-xl font-bold mt-1">Student Categorization</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                  <p className="text-indigo-100 text-sm font-semibold">Excellent</p>
                </div>
                <h4 className="text-3xl font-bold">25</h4>
                <p className="text-xs text-green-300 mt-1 font-medium">Top performers</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></span>
                  <p className="text-indigo-100 text-sm font-semibold">Average</p>
                </div>
                <h4 className="text-3xl font-bold">18</h4>
                <p className="text-xs text-yellow-300 mt-1 font-medium">Needs attention</p>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></span>
                  <p className="text-indigo-100 text-sm font-semibold">Low</p>
                </div>
                <h4 className="text-3xl font-bold">5</h4>
                <p className="text-xs text-red-300 mt-1 font-medium">Critical focus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
'''

new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE|re.DOTALL)

if new_content != content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replace success!")
else:
    print("Regex failed to match.")
